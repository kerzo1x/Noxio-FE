<script setup lang="ts">
import { onBeforeUnmount, nextTick, ref } from 'vue'
import NoteParagraphBlockView from '@/components/notes/editor/NoteParagraphBlock.vue'
import NoteBulletedListBlockView from '@/components/notes/editor/NoteBulletedListBlock.vue'
import type { NoteBlock, NoteBulletedListBlock, NoteParagraphBlock, NoteSpan } from '@/types/notes'
import {
  cancelListBlockInput,
  cancelListItemInput,
  cancelParagraphInput,
  flushAllPendingInput,
  flushListItemInput,
  flushParagraphInput,
  scheduleListItemInput,
  scheduleParagraphInput,
} from '@/composables/useDebouncedBlockInput'
import {
  createBulletedList,
  createListItem,
  createParagraph,
  isBulletedList,
  isEffectivelyEmpty,
  isParagraph,
  mergeSpans,
  splitSpansAtOffset,
  spansToPlainText,
} from '@/utils/noteContent'

const props = defineProps<{
  blocks: NoteBlock[]
  focusedBlockIndex: number | null
}>()

const emit = defineEmits<{
  'update:blocks': [NoteBlock[]]
  focusBlock: [number, number | null]
}>()

// TODO: tu mas potencialny memory leak, lebo ked user vymaze napr. 100 blokov textu, tak toto to stale bude mat ako null blocky
const paragraphRefs = ref<Record<number, InstanceType<typeof NoteParagraphBlockView> | null>>({})
const listRefs = ref<Record<number, InstanceType<typeof NoteBulletedListBlockView> | null>>({})

function updateBlocks(next: NoteBlock[]) {
  emit('update:blocks', next)
}

function updateBlock(index: number, block: NoteBlock) {
  const next = [...props.blocks]
  next[index] = block
  updateBlocks(next)
}

function spansFromDomText(text: string, existingSpans: NoteSpan[]): NoteSpan[] {
  if (isEffectivelyEmpty(text)) return [{ text: '' }]
  const wasBold = existingSpans.some((s) => s.bold)
  return [{ text, ...(wasBold ? { bold: true } : {}) }]
}

function focusParagraphAt(blockIndex: number, offset: number) {
  emit('focusBlock', blockIndex, null)
  nextTick(() => {
    nextTick(() => { // TODO: preco su tu 2x nexttick??
      paragraphRefs.value[blockIndex]?.focusAtOffset(offset)
    })
  })
}

function focusListItemAt(blockIndex: number, itemIndex: number, offset: number) {
  emit('focusBlock', blockIndex, itemIndex)
  nextTick(() => {
    nextTick(() => {
      listRefs.value[blockIndex]?.focusItemAtOffset(itemIndex, offset)
    })
  })
}

function applyParagraphInput(index: number, text: string) {
  const block = props.blocks[index]
  if (!isParagraph(block)) return

  if (text.startsWith('- ')) {
    const listText = text.slice(2)
    const list = createBulletedList(listText, block.size)
    updateBlock(index, list)
    focusListItemAt(index, 0, spansToPlainText(list.items[0].spans).length)
    return
  }

  updateBlock(index, {
    ...block,
    spans: spansFromDomText(text, block.spans),
  })
}

function applyListItemInput(blockIndex: number, itemIndex: number, text: string) {
  const block = props.blocks[blockIndex]
  if (!isBulletedList(block)) return
  const item = block.items[itemIndex]
  if (!item) return

  updateBlock(blockIndex, {
    ...block,
    items: block.items.map((it, i) =>
      i === itemIndex ? { ...it, spans: spansFromDomText(text, it.spans) } : it,
    ),
  })
}

function flushParagraph(blockIndex: number) {
  flushParagraphInput(blockIndex, (text) => applyParagraphInput(blockIndex, text))
}

function flushListItem(blockIndex: number, itemIndex: number) {
  flushListItemInput(blockIndex, itemIndex, (text) =>
    applyListItemInput(blockIndex, itemIndex, text),
  )
}

// Reads current paragraph state (including any pending input) and cancels the
// pending debounce so the caller can emit ONE atomic update instead of two.
function consumeParagraphBlock(index: number): NoteParagraphBlock | null {
  const block = props.blocks[index]
  if (!isParagraph(block)) return null
  const pending = cancelParagraphInput(index)
  if (pending === undefined) return block
  return { ...block, spans: spansFromDomText(pending, block.spans) }
}

// Same for list blocks — reads all pending item text, cancels timers.
function consumeListBlock(blockIndex: number): NoteBulletedListBlock | null {
  const block = props.blocks[blockIndex]
  if (!isBulletedList(block)) return null
  let items = block.items
  for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
    const pending = cancelListItemInput(blockIndex, itemIndex)
    if (pending === undefined) continue
    const item = items[itemIndex]
    if (!item) continue
    items = items.map((it, i) =>
      i === itemIndex ? { ...it, spans: spansFromDomText(pending, it.spans) } : it,
    )
  }
  cancelListBlockInput(blockIndex)
  return { ...block, items }
}


function onParagraphInput(index: number, text: string) {
  if (text.startsWith('- ')) {
    flushParagraph(index)
    applyParagraphInput(index, text)
    return
  }
  scheduleParagraphInput(index, text, (pending) => applyParagraphInput(index, pending))
}

function onParagraphBlur(index: number) {
  flushParagraph(index)
}

function onListItemInput(blockIndex: number, itemIndex: number, text: string) {
  scheduleListItemInput(blockIndex, itemIndex, text, (pending) =>
    applyListItemInput(blockIndex, itemIndex, pending),
  )
}

function onListItemBlur(blockIndex: number, itemIndex: number) {
  flushListItem(blockIndex, itemIndex)
}

function onParagraphEnter(index: number, offset: number) {
  const block = consumeParagraphBlock(index)
  if (!block) return

  const { left, right } = splitSpansAtOffset(block.spans, offset)
  const next = [...props.blocks]
  next[index] = { ...block, spans: left }
  next.splice(index + 1, 0, {
    ...createParagraph(spansToPlainText(right), block.size),
    spans: right,
  })
  updateBlocks(next)
  paragraphRefs.value[index]?.setDomText(spansToPlainText(left))
  focusParagraphAt(index + 1, 0)
}

function onParagraphBackspaceAtStart(index: number, text: string) {
  if (index === 0) return

  const block = consumeParagraphBlock(index)
  if (!block) return

  const currentSpans = spansFromDomText(text, block.spans)
  const prevBlock = props.blocks[index - 1]
  const next = [...props.blocks]

  if (isParagraph(prevBlock)) {
    const prevTextLen = spansToPlainText(prevBlock.spans).length
    next[index - 1] = {
      ...prevBlock,
      spans: mergeSpans(prevBlock.spans, currentSpans),
    }
    next.splice(index, 1)
    updateBlocks(next)
    focusParagraphAt(index - 1, prevTextLen)
    return
  }

  if (isBulletedList(prevBlock) && prevBlock.items.length > 0) {
    const lastIdx = prevBlock.items.length - 1
    const lastItem = prevBlock.items[lastIdx]
    const prevTextLen = spansToPlainText(lastItem.spans).length
    next[index - 1] = {
      ...prevBlock,
      items: prevBlock.items.map((item, i) =>
        i === lastIdx ? { ...item, spans: mergeSpans(item.spans, currentSpans) } : item,
      ),
    }
    next.splice(index, 1)
    updateBlocks(next)
    focusListItemAt(index - 1, lastIdx, prevTextLen)
  }
}

function onParagraphDeleteAtEnd(index: number) {
  if (index >= props.blocks.length - 1) return

  const block = consumeParagraphBlock(index)
  if (!block) return

  const nextBlock = props.blocks[index + 1]
  const cursorOffset = spansToPlainText(block.spans).length
  const next = [...props.blocks]

  if (isParagraph(nextBlock)) {
    const merged = mergeSpans(block.spans, nextBlock.spans)
    next[index] = { ...block, spans: merged }
    next.splice(index + 1, 1)
    updateBlocks(next)
    paragraphRefs.value[index]?.setDomText(spansToPlainText(merged))
    focusParagraphAt(index, cursorOffset)
    return
  }

  if (isBulletedList(nextBlock) && nextBlock.items.length > 0) {
    const firstItem = nextBlock.items[0]
    const merged = mergeSpans(block.spans, firstItem.spans)
    next[index] = { ...block, spans: merged }

    const remainingItems = nextBlock.items.slice(1)
    if (remainingItems.length === 0) {
      next.splice(index + 1, 1)
    } else {
      next[index + 1] = { ...nextBlock, items: remainingItems }
    }

    updateBlocks(next)
    paragraphRefs.value[index]?.setDomText(spansToPlainText(merged))
    focusParagraphAt(index, cursorOffset)
  }
}

// Removes item at itemIndex, splits list into before/after parts, inserts a paragraph between.
function splitListAtItem(blockIndex: number, block: NoteBulletedListBlock, itemIndex: number) {
  const item = block.items[itemIndex]
  if (!item) return

  const before = block.items.slice(0, itemIndex)
  const after = block.items.slice(itemIndex + 1)
  const paragraph = createParagraph('', item.size)
  const next = [...props.blocks]

  if (before.length > 0) {
    next[blockIndex] = { ...block, items: before }
    const insertions: NoteBlock[] = [paragraph]
    if (after.length > 0) insertions.push({ ...block, items: after })
    next.splice(blockIndex + 1, 0, ...insertions)
    updateBlocks(next)
    focusParagraphAt(blockIndex + 1, 0)
  } else {
    const insertions: NoteBlock[] = [paragraph]
    if (after.length > 0) insertions.push({ ...block, items: after })
    next.splice(blockIndex, 1, ...insertions)
    updateBlocks(next)
    focusParagraphAt(blockIndex, 0)
  }
}

function onListEnter(blockIndex: number, itemIndex: number, offset: number) {
  const block = consumeListBlock(blockIndex)
  if (!block) return

  const item = block.items[itemIndex]
  if (!item) return

  // Enter on empty item → split list, insert paragraph between the two halves
  if (isEffectivelyEmpty(spansToPlainText(item.spans))) {
    splitListAtItem(blockIndex, block, itemIndex)
    return
  }

  // Enter on non-empty item → split at cursor, create new list item
  const { left, right } = splitSpansAtOffset(item.spans, offset)
  const newItem = { ...createListItem('', item.size), spans: right }
  const next = [...props.blocks]
  next[blockIndex] = {
    ...block,
    items: [
      ...block.items.slice(0, itemIndex),
      { ...item, spans: left },
      newItem,
      ...block.items.slice(itemIndex + 1),
    ],
  }
  updateBlocks(next)
  listRefs.value[blockIndex]?.setItemDomText(itemIndex, spansToPlainText(left))
  focusListItemAt(blockIndex, itemIndex + 1, 0)
}

function onListBackspaceAtStart(blockIndex: number, itemIndex: number, text: string) {
  // Backspace on empty item → split list, inserting paragraph at this position
  if (isEffectivelyEmpty(text)) {
    const block = consumeListBlock(blockIndex)
    if (!block) return
    splitListAtItem(blockIndex, block, itemIndex)
    return
  }

  const block = props.blocks[blockIndex]
  if (!isBulletedList(block)) return

  const item = block.items[itemIndex]
  if (!item) return

  const itemSpans = spansFromDomText(text, item.spans)

  if (itemIndex > 0) {
    const prevItem = block.items[itemIndex - 1]
    const prevTextLen = spansToPlainText(prevItem.spans).length
    updateBlock(blockIndex, {
      ...block,
      items: block.items
        .map((listItem, i) =>
          i === itemIndex - 1
            ? { ...listItem, spans: mergeSpans(listItem.spans, itemSpans) }
            : listItem,
        )
        .filter((_, i) => i !== itemIndex),
    })
    focusListItemAt(blockIndex, itemIndex - 1, prevTextLen)
    return
  }

  if (blockIndex === 0 && item.bulleted !== false) {
    const remainingItems = block.items.slice(1)
    const paragraphText = isEffectivelyEmpty(text) ? '' : text
    const next = [...props.blocks]

    if (remainingItems.length === 0) {
      next.splice(0, 1, createParagraph(paragraphText, item.size))
      updateBlocks(next)
      focusParagraphAt(0, paragraphText.length)
      return
    }

    next.splice(0, 0, createParagraph(paragraphText, item.size))
    next[1] = { ...block, items: remainingItems }
    updateBlocks(next)
    focusParagraphAt(0, paragraphText.length)
    return
  }

  if (blockIndex === 0) return

  const prevBlock = props.blocks[blockIndex - 1]
  const remainingItems = block.items.slice(1)
  const next = [...props.blocks]

  if (isParagraph(prevBlock)) {
    const prevTextLen = spansToPlainText(prevBlock.spans).length
    next[blockIndex - 1] = {
      ...prevBlock,
      spans: mergeSpans(prevBlock.spans, itemSpans),
    }

    if (remainingItems.length === 0) {
      next.splice(blockIndex, 1)
    } else {
      next[blockIndex] = { ...block, items: remainingItems }
    }

    updateBlocks(next)
    focusParagraphAt(blockIndex - 1, prevTextLen)
    return
  }

  if (isBulletedList(prevBlock)) {
    next[blockIndex - 1] = {
      ...prevBlock,
      items: [...prevBlock.items, { ...item, spans: itemSpans }],
    }

    if (remainingItems.length === 0) {
      next.splice(blockIndex, 1)
    } else {
      next[blockIndex] = { ...block, items: remainingItems }
    }

    updateBlocks(next)
    focusListItemAt(blockIndex - 1, prevBlock.items.length, 0)
  }
}

function onListDeleteAtEnd(blockIndex: number, itemIndex: number) {
  const block = consumeListBlock(blockIndex)
  if (!block) return
  if (itemIndex !== block.items.length - 1) return
  if (blockIndex >= props.blocks.length - 1) return

  const item = block.items[itemIndex]
  if (!item) return

  const nextBlock = props.blocks[blockIndex + 1]
  const cursorOffset = spansToPlainText(item.spans).length
  const next = [...props.blocks]

  if (isParagraph(nextBlock)) {
    const merged = mergeSpans(item.spans, nextBlock.spans)
    next[blockIndex] = {
      ...block,
      items: block.items.map((it, i) => i === itemIndex ? { ...it, spans: merged } : it),
    }
    next.splice(blockIndex + 1, 1)
    updateBlocks(next)
    listRefs.value[blockIndex]?.setItemDomText(itemIndex, spansToPlainText(merged))
    focusListItemAt(blockIndex, itemIndex, cursorOffset)
    return
  }

  if (isBulletedList(nextBlock) && nextBlock.items.length > 0) {
    const merged = mergeSpans(item.spans, nextBlock.items[0].spans)
    next[blockIndex] = {
      ...block,
      items: [
        ...block.items.slice(0, itemIndex),
        { ...item, spans: merged },
        ...block.items.slice(itemIndex + 1),
        ...nextBlock.items.slice(1),
      ],
    }
    next.splice(blockIndex + 1, 1)
    updateBlocks(next)
    listRefs.value[blockIndex]?.setItemDomText(itemIndex, spansToPlainText(merged))
    focusListItemAt(blockIndex, itemIndex, cursorOffset)
  }
}

function flushAllPending() {
  flushAllPendingInput(
    (index, text) => applyParagraphInput(index, text),
    (blockIndex, itemIndex, text) => applyListItemInput(blockIndex, itemIndex, text),
  )
}

async function focusBlockAtEnd(index: number) {
  flushAllPending()
  await nextTick()
  const block = props.blocks[index]
  if (!block) return

  if (isParagraph(block)) {
    paragraphRefs.value[index]?.focusAtEnd()
    return
  }

  if (isBulletedList(block)) {
    const lastItemIndex = block.items.length - 1
    listRefs.value[index]?.focusItemAtEnd(lastItemIndex)
  }
}

onBeforeUnmount(() => {
  flushAllPending()
})

defineExpose({
  flushPendingInput: flushAllPending,
  focusParagraph: async (index: number) => {
    await nextTick()
    paragraphRefs.value[index]?.focus()
  },
  focusListItem: async (blockIndex: number, itemIndex: number) => {
    await nextTick()
    listRefs.value[blockIndex]?.focusItem(itemIndex)
  },
  focusBlockAtEnd,
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <template
      v-for="(block, index) in blocks"
      :key="index"
    >
      <NoteParagraphBlockView
        v-if="isParagraph(block)"
        :ref="(el) => { paragraphRefs[index] = el as InstanceType<typeof NoteParagraphBlockView> | null }"
        :block="block"
        @input="onParagraphInput(index, $event)"
        @blur="onParagraphBlur(index)"
        @enter="onParagraphEnter(index, $event)"
        @backspace-at-start="onParagraphBackspaceAtStart(index, $event)"
        @delete-at-end="onParagraphDeleteAtEnd(index)"
        @focus="emit('focusBlock', index, null)"
      />

      <NoteBulletedListBlockView
        v-else-if="isBulletedList(block)"
        :ref="(el) => { listRefs[index] = el as InstanceType<typeof NoteBulletedListBlockView> | null }"
        :block="block"
        @item-input="(itemIndex, text) => onListItemInput(index, itemIndex, text)"
        @item-blur="(itemIndex) => onListItemBlur(index, itemIndex)"
        @enter="(itemIndex, offset) => onListEnter(index, itemIndex, offset)"
        @backspace-at-start="(itemIndex, text) => onListBackspaceAtStart(index, itemIndex, text)"
        @delete-at-end="(itemIndex) => onListDeleteAtEnd(index, itemIndex)"
        @focus="emit('focusBlock', index, $event)"
      />
    </template>
  </div>
</template>