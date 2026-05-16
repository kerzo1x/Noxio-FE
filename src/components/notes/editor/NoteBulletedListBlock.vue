<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import type { NoteBulletedListBlock, NoteListItemNode } from '@/types/notes'
import { blockSizeClass, createListItem, spansToPlainText } from '@/utils/noteContent'

const props = defineProps<{
  block: NoteBulletedListBlock
}>()

const emit = defineEmits<{
  'update:items': [NoteListItemNode[]]
  enterAfter: [number]
  backspaceEmpty: [number]
  focus: [number]
}>()

const itemRefs = ref<Record<number, HTMLDivElement | null>>({})

function setItemRef(index: number, el: HTMLDivElement | null) {
  if (el) {
    itemRefs.value[index] = el
  } else {
    delete itemRefs.value[index]
  }
}

function syncItemDom(index: number, item: NoteListItemNode) {
  const el = itemRefs.value[index]
  if (!el) return
  const text = spansToPlainText(item.spans)
  if (el.innerText !== text) {
    el.innerText = text
  }
}

onMounted(() => {
  props.block.items.forEach((item, index) => syncItemDom(index, item))
})

watch(
  () => props.block.items,
  (items) => {
    items.forEach((item, index) => syncItemDom(index, item))
  },
  { deep: true },
)

function updateItemText(index: number, text: string) {
  const items = props.block.items.map((item, i) => {
    if (i !== index) return item
    const wasBold = item.spans.some((s) => s.bold)
    return {
      ...item,
      spans: [{ text, ...(wasBold ? { bold: true } : {}) }],
    }
  })
  emit('update:items', items)
}

function onItemInput(index: number, event: Event) {
  const text = (event.target as HTMLDivElement).innerText.replace(/\n$/, '')
  updateItemText(index, text)
}

function onItemKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    emit('enterAfter', index)
    return
  }

  if (event.key === 'Backspace') {
    const text = itemRefs.value[index]?.innerText ?? ''
    if (text.length === 0) {
      event.preventDefault()
      emit('backspaceEmpty', index)
    }
  }
}

function addItemAfter(index: number) {
  const items = [...props.block.items]
  items.splice(index + 1, 0, createListItem())
  emit('update:items', items)

  nextTick(() => {
    itemRefs.value[index + 1]?.focus()
  })
}

defineExpose({
  focusItem: async (index: number) => {
    await nextTick()
    itemRefs.value[index]?.focus()
  },
  addItemAfter,
})
</script>

<template>
  <ul
    class="list-disc space-y-1 pl-5 text-white/75"
    :class="block.items[0] ? blockSizeClass(block.items[0].size) : blockSizeClass('small')"
  >
    <li
      v-for="(item, index) in block.items"
      :key="item.id"
      class="marker:text-white/50"
    >
      <div
        :ref="(el) => setItemRef(index, el as HTMLDivElement | null)"
        contenteditable="true"
        class="min-h-[1.25em] whitespace-pre-wrap break-words outline-none"
        :class="item.spans.some((s) => s.bold) ? 'font-semibold' : 'font-normal'"
        @input="onItemInput(index, $event)"
        @keydown="onItemKeydown(index, $event)"
        @focus="emit('focus', index)"
      />
    </li>
  </ul>
</template>
