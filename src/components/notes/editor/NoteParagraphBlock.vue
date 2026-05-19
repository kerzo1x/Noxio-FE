<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { NoteParagraphBlock } from '@/types/notes'
import { blockSizeClass, spansToPlainText } from '@/utils/noteContent'
import { getCaretOffset, placeCaretAtEnd, placeCaretAtOffset } from '@/utils/editorSelection'

const props = defineProps<{
  block: NoteParagraphBlock
}>()

const emit = defineEmits<{
  input: [string]
  blur: []
  enter: [number]
  backspaceAtStart: [string]
  deleteAtEnd: []
  focus: []
}>()

const editorRef = ref<HTMLDivElement | null>(null)
const isComposing = ref(false)

function syncDomText() {
  const el = editorRef.value
  if (!el) return
  if (isComposing.value) return
  if (document.activeElement === el) return
  const text = spansToPlainText(props.block.spans)
  if (el.innerText.replace(/\n$/, '') !== text) {
    el.innerText = text
  }
}

function forceDomText(text: string) {
  const el = editorRef.value
  if (!el || isComposing.value) return
  if (el.innerText.replace(/\n$/, '') === text) return
  const offset = document.activeElement === el ? getCaretOffset(el) : null
  el.innerText = text
  if (offset !== null) placeCaretAtOffset(el, Math.min(offset, text.length))
}

onMounted(syncDomText)

watch(() => props.block.spans, syncDomText, { deep: true })

function onInput() {
  if (isComposing.value) return
  const text = editorRef.value?.innerText ?? ''
  emit('input', text.replace(/\n$/, ''))
}

function onCompositionStart() {
  isComposing.value = true
}

function onCompositionEnd() {
  isComposing.value = false
  onInput()
}

function onPaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') ?? ''
  if (!text) return
  document.execCommand('insertText', false, text)
  onInput()
}

function onKeydown(event: KeyboardEvent) {
  if (event.isComposing || isComposing.value) return

  const el = editorRef.value
  if (!el) return

  const text = el.innerText.replace(/\n$/, '')

  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    emit('enter', getCaretOffset(el))
    return
  }

  if (event.key === 'Backspace') {
    if (getCaretOffset(el) === 0) {
      event.preventDefault()
      emit('backspaceAtStart', text)
    }
    return
  }

  if (event.key === 'Delete') {
    if (getCaretOffset(el) === text.length) {
      event.preventDefault()
      emit('deleteAtEnd')
    }
    return
  }

  if (event.key === 'Tab') {
    event.preventDefault()
  }
}

function onFocus() {
  emit('focus')
}

function onBlur() {
  emit('blur')
}

defineExpose({
  focus: () => editorRef.value?.focus(),
  focusAtEnd: () => {
    if (editorRef.value) placeCaretAtEnd(editorRef.value)
  },
  focusAtOffset: (offset: number) => {
    if (editorRef.value) placeCaretAtOffset(editorRef.value, offset)
  },
  setDomText: forceDomText,
})
</script>

<template>
  <div
    class="w-full text-white/75"
    :class="[
      blockSizeClass(block.size),
      block.spans.some((s) => s.bold) ? 'font-semibold' : 'font-normal',
    ]"
  >
    <div
      ref="editorRef"
      contenteditable="true"
      class="min-h-[1.5em] w-full whitespace-pre-wrap break-words outline-none"
      @input="onInput"
      @keydown="onKeydown"
      @paste="onPaste"
      @compositionstart="onCompositionStart"
      @compositionend="onCompositionEnd"
      @focus="onFocus"
      @blur="onBlur"
    />
  </div>
</template>
