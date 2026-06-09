<script setup lang="ts">
import { computed } from 'vue'
import {
  formatDdMmYyyyDigits,
  formatDeadlineDisplay,
} from '@/utils/taskDeadline'

const deadline = defineModel<string>({ default: '' })

defineProps<{
  showDeadlineError: boolean
}>()

const emit = defineEmits<{
  clearError: []
}>()

const formattedDeadline = computed(() => formatDeadlineDisplay(deadline.value))

function onDeadlineInput(event: Event) {
  const target = event.target as HTMLInputElement
  const digits = target.value.replace(/\D/g, '').slice(0, 8)
  deadline.value = formatDdMmYyyyDigits(digits)
  emit('clearError')
}

function onDeadlineKeydown(event: KeyboardEvent) {
  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ]

  if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
    return
  }

  if (!/^\d$/.test(event.key)) {
    event.preventDefault()
    return
  }

  const target = event.target as HTMLInputElement
  const digits = target.value.replace(/\D/g, '')
  const hasSelection = target.selectionStart !== target.selectionEnd

  if (digits.length >= 8 && !hasSelection) {
    event.preventDefault()
  }
}

function onDeadlinePaste(event: ClipboardEvent) {
  event.preventDefault()
  const pasted = event.clipboardData?.getData('text') ?? ''
  const digits = (
    deadline.value.replace(/\D/g, '') + pasted.replace(/\D/g, '')
  ).slice(0, 8)
  deadline.value = formatDdMmYyyyDigits(digits)
  emit('clearError')
}
</script>

<template>
  <div>
    <div class="task-popup-meta-row">
      <span class="task-popup-meta-label">Deadline</span>
      <input
        :value="deadline"
        type="text"
        inputmode="numeric"
        name="task-deadline"
        placeholder="10.5.2026"
        class="task-popup-deadline"
        :class="{
          'task-popup-deadline--filled': Boolean(formattedDeadline),
          'task-popup-deadline--error': showDeadlineError,
        }"
        maxlength="10"
        autocomplete="off"
        aria-label="Deadline"
        @input="onDeadlineInput"
        @keydown="onDeadlineKeydown"
        @paste="onDeadlinePaste"
      />
    </div>
    <p
      v-if="showDeadlineError"
      class="task-popup-deadline-hint task-popup-deadline-hint--error"
    >
      Enter a valid date (e.g. 10.5.2026)
    </p>
  </div>
</template>
