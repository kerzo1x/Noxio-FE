<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import type { NoteParagraphBlock } from '@/types/notes'
import { blockSizeClass, spansToPlainText } from '@/utils/noteContent'

const props = defineProps<{
  block: NoteParagraphBlock
}>()

const emit = defineEmits<{
  input: [string]
  enter: []
  backspaceEmpty: []
  focus: []
}>()

const editorRef = ref<HTMLDivElement | null>(null)

function syncDomText() {
  const el = editorRef.value
  if (!el) return
  const text = spansToPlainText(props.block.spans)
  if (el.innerText !== text) {
    el.innerText = text
  }
}

onMounted(syncDomText)

watch(() => props.block.spans, syncDomText, { deep: true })

function onInput() {
  const text = editorRef.value?.innerText ?? ''
  emit('input', text.replace(/\n$/, ''))
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    emit('enter')
  }

  if (event.key === 'Backspace') {
    const text = editorRef.value?.innerText ?? ''
    if (text.length === 0) {
      event.preventDefault()
      emit('backspaceEmpty')
    }
  }
}

async function onFocus() {
  emit('focus')
  await nextTick()
  editorRef.value?.focus()
}

defineExpose({ focus: () => editorRef.value?.focus() })
</script>

<template>
  <div
    ref="editorRef"
    contenteditable="true"
    class="min-h-[1.5em] w-full whitespace-pre-wrap break-words text-white/75 outline-none"
    :class="[
      blockSizeClass(block.size),
      block.spans.some((s) => s.bold) ? 'font-semibold' : 'font-normal',
    ]"
    @input="onInput"
    @keydown="onKeydown"
    @focus="onFocus"
  />
</template>
