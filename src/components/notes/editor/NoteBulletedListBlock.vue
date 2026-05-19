<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import type { NoteBulletedListBlock, NoteListItemNode } from '@/types/notes'
import { blockSizeClass, spansToPlainText } from '@/utils/noteContent'
import {
  getCaretOffset,
  isCaretAtEnd,
  isCaretAtStart,
  placeCaretAtEnd,
  placeCaretAtOffset,
} from '@/utils/editorSelection'

const props = defineProps<{
  block: NoteBulletedListBlock
}>()

const emit = defineEmits<{
  itemInput: [number, string]
  itemBlur: [number]
  enter: [number, number]
  backspaceAtStart: [number, string]
  deleteAtEnd: [number]
  focus: [number]
}>()

const itemRefs = ref<Record<number, HTMLDivElement | null>>({})
const isComposing = ref(false)
const composingItemIndex = ref<number | null>(null)

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
  if (isComposing.value && composingItemIndex.value === index) return
  if (document.activeElement === el) return
  const text = spansToPlainText(item.spans)
  if (el.innerText.replace(/\n$/, '') !== text) {
    el.innerText = text
  }
}

function forceItemDomText(index: number, text: string) {
  const el = itemRefs.value[index]
  if (!el || (isComposing.value && composingItemIndex.value === index)) return
  if (el.innerText.replace(/\n$/, '') === text) return
  const offset = document.activeElement === el ? getCaretOffset(el) : null
  el.innerText = text
  if (offset !== null) placeCaretAtOffset(el, Math.min(offset, text.length))
}

onMounted(() => {
  props.block.items.forEach((item, index) => syncItemDom(index, item))
})

watch(
  () => props.block.items,
  (items) => {
    items.forEach((item, index) => syncItemDom(index, item))
  },
  { deep: true, flush: 'post' },
)

function onItemInput(index: number, event: Event) {
  if (isComposing.value && composingItemIndex.value === index) return
  const text = (event.target as HTMLDivElement).innerText.replace(/\n$/, '')
  emit('itemInput', index, text)
}

function onItemCompositionStart(index: number) {
  isComposing.value = true
  composingItemIndex.value = index
}

function onItemCompositionEnd(index: number, event: Event) {
  isComposing.value = false
  composingItemIndex.value = null
  const text = (event.target as HTMLDivElement).innerText.replace(/\n$/, '')
  emit('itemInput', index, text)
}

function onItemPaste(index: number, event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') ?? ''
  if (!text) return
  document.execCommand('insertText', false, text)
  const el = itemRefs.value[index]
  if (el) {
    const currentText = el.innerText.replace(/\n$/, '')
    emit('itemInput', index, currentText)
  }
}

function onItemKeydown(index: number, event: KeyboardEvent) {
  if (event.isComposing || (isComposing.value && composingItemIndex.value === index)) return

  const el = itemRefs.value[index]
  if (!el) return

  const text = el.innerText.replace(/\n$/, '')

  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    emit('enter', index, getCaretOffset(el))
    return
  }

  if (event.key === 'Backspace') {
    if (isCaretAtStart(el)) {
      event.preventDefault()
      emit('backspaceAtStart', index, text)
    }
    return
  }

  if (event.key === 'Delete') {
    const isLastItem = index === props.block.items.length - 1
    if (isLastItem && isCaretAtEnd(el)) {
      event.preventDefault()
      emit('deleteAtEnd', index)
    }
    return
  }

  if (event.key === 'Tab') {
    event.preventDefault()
  }
}

defineExpose({
  focusItem: async (index: number) => {
    await nextTick()
    itemRefs.value[index]?.focus()
  },
  focusItemAtEnd: async (index: number) => {
    await nextTick()
    const el = itemRefs.value[index]
    if (el) placeCaretAtEnd(el)
  },
  focusItemAtOffset: async (index: number, offset: number) => {
    await nextTick()
    const el = itemRefs.value[index]
    if (el) placeCaretAtOffset(el, offset)
  },
  setItemDomText: forceItemDomText,
})
</script>

<template>
  <ul class="flex flex-col gap-1 text-white/75">
    <li
      v-for="(item, index) in block.items"
      :key="item.id"
      class="flex items-start gap-2"
    >
      <span
        v-if="item.bulleted !== false"
        class="shrink-0 select-none text-white/50"
        :class="blockSizeClass(item.size)"
      >•</span>
      <div
        class="min-w-0 flex-1"
        :class="[
          blockSizeClass(item.size),
          item.spans.some((s) => s.bold) ? 'font-semibold' : 'font-normal',
        ]"
      >
        <div
          :ref="(el) => setItemRef(index, el as HTMLDivElement | null)"
          contenteditable="true"
          class="min-h-[1.25em] w-full whitespace-pre-wrap break-words outline-none"
          @input="onItemInput(index, $event)"
          @keydown="onItemKeydown(index, $event)"
          @paste="onItemPaste(index, $event)"
          @compositionstart="onItemCompositionStart(index)"
          @compositionend="onItemCompositionEnd(index, $event)"
          @focus="emit('focus', index)"
          @blur="emit('itemBlur', index)"
        />
      </div>
    </li>
  </ul>
</template>
