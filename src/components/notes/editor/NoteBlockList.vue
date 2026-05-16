<script setup lang="ts">
import { nextTick, ref } from 'vue'
import NoteParagraphBlockView from '@/components/notes/editor/NoteParagraphBlock.vue'
import NoteBulletedListBlockView from '@/components/notes/editor/NoteBulletedListBlock.vue'
import type { NoteBlock, NoteBulletedListBlock } from '@/types/notes'
import {
  createBulletedList,
  createListItem,
  createParagraph,
  isBulletedList,
  isParagraph,
  plainTextToSpans,
} from '@/utils/noteContent'

const props = defineProps<{
  blocks: NoteBlock[]
  focusedBlockIndex: number | null
}>()

const emit = defineEmits<{
  'update:blocks': [NoteBlock[]]
  focusBlock: [number, number | null]
  enterAfter: [number]
  backspaceEmpty: [number]
}>()

const paragraphRefs = ref<Record<number, InstanceType<typeof NoteParagraphBlockView> | null>>({})
const listRefs = ref<Record<number, InstanceType<typeof NoteBulletedListBlockView> | null>>({})

function updateBlock(index: number, block: NoteBlock) {
  const next = [...props.blocks]
  next[index] = block
  emit('update:blocks', next)
}

function onParagraphInput(index: number, text: string) {
  const block = props.blocks[index]
  if (!isParagraph(block)) return

  if (text.startsWith('- ')) {
    const listText = text.slice(2)
    const list = createBulletedList(listText, block.size)
    updateBlock(index, list)
    emit('focusBlock', index, 0)
    return
  }

  const wasBold = block.spans.some((s) => s.bold)
  updateBlock(index, {
    ...block,
    spans: plainTextToSpans(text, true, wasBold),
  })
}

function onParagraphEnter(index: number) {
  emit('enterAfter', index)
}

function onParagraphBackspace(index: number) {
  emit('backspaceEmpty', index)
}

function onListItemsUpdate(index: number, items: NoteBulletedListBlock['items']) {
  const block = props.blocks[index]
  if (!isBulletedList(block)) return
  updateBlock(index, { ...block, items })
}

function onListEnterAfter(blockIndex: number, itemIndex: number) {
  const block = props.blocks[blockIndex]
  if (!isBulletedList(block)) return

  const items = [...block.items]
  items.splice(itemIndex + 1, 0, createListItem())
  updateBlock(blockIndex, { ...block, items })

  nextTick(() => {
    listRefs.value[blockIndex]?.focusItem(itemIndex + 1)
  })
}

function onListBackspaceEmpty(blockIndex: number, itemIndex: number) {
  const block = props.blocks[blockIndex]
  if (!isBulletedList(block)) return

  if (block.items.length <= 1) {
    updateBlock(blockIndex, createParagraph('', block.items[0]?.size ?? 'small'))
    emit('focusBlock', blockIndex, null)
    nextTick(() => paragraphRefs.value[blockIndex]?.focus())
    return
  }

  const items = block.items.filter((_, i) => i !== itemIndex)
  updateBlock(blockIndex, { ...block, items })

  nextTick(() => {
    const focusIndex = Math.max(0, itemIndex - 1)
    listRefs.value[blockIndex]?.focusItem(focusIndex)
  })
}

defineExpose({
  focusParagraph: async (index: number) => {
    await nextTick()
    paragraphRefs.value[index]?.focus()
  },
  focusListItem: async (blockIndex: number, itemIndex: number) => {
    await nextTick()
    listRefs.value[blockIndex]?.focusItem(itemIndex)
  },
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
        @enter="onParagraphEnter(index)"
        @backspace-empty="onParagraphBackspace(index)"
        @focus="emit('focusBlock', index, null)"
      />

      <NoteBulletedListBlockView
        v-else-if="isBulletedList(block)"
        :ref="(el) => { listRefs[index] = el as InstanceType<typeof NoteBulletedListBlockView> | null }"
        :block="block"
        @update:items="onListItemsUpdate(index, $event)"
        @enter-after="onListEnterAfter(index, $event)"
        @backspace-empty="onListBackspaceEmpty(index, $event)"
        @focus="emit('focusBlock', index, $event)"
      />
    </template>
  </div>
</template>
