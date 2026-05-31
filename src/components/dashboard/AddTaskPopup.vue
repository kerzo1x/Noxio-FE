<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useTodoListsStore } from '@/stores/todoLists'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  todoListId: string
}>()

const todoListsStore = useTodoListsStore()

const title = ref('')
const description = ref('')
const deadlineInput = ref('')
const classValue = ref('')

const isSubmitting = ref(false)
const isError = ref(false)
const showDeadlineError = ref(false)
const message = ref('')

const resetForm = () => {
  title.value = ''
  description.value = ''
  deadlineInput.value = ''
  classValue.value = ''
  isError.value = false
  showDeadlineError.value = false
  message.value = ''
  isSubmitting.value = false
}

const close = () => {
  resetForm()
  open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) resetForm()
})

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && open.value) close()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})

const clearError = () => {
  isError.value = false
  showDeadlineError.value = false
  message.value = ''
}

function formatDdMmYyyyDigits(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length < 8) return `${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4)}`

  const day = Number.parseInt(d.slice(0, 2), 10)
  const month = Number.parseInt(d.slice(2, 4), 10)
  const year = d.slice(4, 8)
  return `${day}.${month}.${year}`
}

function parseDdMmYyyy(input: string): { day: number; month: number; year: number } | null {
  const parts = input.split('.').filter(Boolean)
  if (parts.length !== 3) return null

  const day = Number.parseInt(parts[0] ?? '', 10)
  const month = Number.parseInt(parts[1] ?? '', 10)
  const year = Number.parseInt(parts[2] ?? '', 10)

  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
    return null
  }

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1000) {
    return null
  }

  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return { day, month, year }
}

const formattedDeadline = computed(() => {
  const parsed = parseDdMmYyyy(deadlineInput.value)
  if (!parsed) return null
  return `${parsed.day}.${parsed.month}.${parsed.year}`
})

function deadlineToIso(input: string): string | null {
  const parsed = parseDdMmYyyy(input)
  if (!parsed) return null
  const date = new Date(parsed.year, parsed.month - 1, parsed.day, 23, 59, 59, 999)
  return date.toISOString()
}

function onDeadlineInput(event: Event) {
  const target = event.target as HTMLInputElement
  const digits = target.value.replace(/\D/g, '').slice(0, 8)
  deadlineInput.value = formatDdMmYyyyDigits(digits)
  showDeadlineError.value = false
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
  const digits = (deadlineInput.value.replace(/\D/g, '') + pasted.replace(/\D/g, '')).slice(
    0,
    8,
  )
  deadlineInput.value = formatDdMmYyyyDigits(digits)
  showDeadlineError.value = false
}

const handleSubmit = async () => {
  const trimmed = title.value.trim()
  if (!trimmed || isSubmitting.value) return

  if (!props.todoListId) {
    isError.value = true
    message.value = 'Todo list not found.'
    return
  }

  if (deadlineInput.value.trim() && !deadlineToIso(deadlineInput.value)) {
    isError.value = true
    showDeadlineError.value = true
    message.value = 'Enter a valid deadline (e.g. 10.5.2026).'
    return
  }

  isSubmitting.value = true
  isError.value = false
  message.value = ''

  try {
    const categoryId = classValue.value.trim() || null
    await todoListsStore.createTodoTask(props.todoListId, {
      title: trimmed,
      description: description.value,
      categoryId,
      deadlineAt: deadlineInput.value.trim()
        ? deadlineToIso(deadlineInput.value)
        : null,
      status: 'TODO',
    })
    close()
  } catch (err) {
    isError.value = true
    message.value =
      err instanceof Error ? err.message : 'Failed to create task.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="task-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-task-popup-title"
    >
      <div class="task-popup-backdrop" aria-hidden="true" @click="close" />

      <div class="task-popup-card" @click.stop>
        <form class="task-popup-form" @submit.prevent="handleSubmit">
          <div class="task-popup-content">
            <div class="task-popup-body">
              <div class="task-popup-header">
                <h2 id="add-task-popup-title" class="task-popup-title">
                  Create task
                </h2>
                <button type="button" class="task-popup-cancel" @click="close">
                  Cancel
                </button>
              </div>

              <div class="task-popup-fields">
                <input
                  v-model="title"
                  type="text"
                  name="task-title"
                  placeholder="Task name"
                  class="task-popup-field"
                  :class="{ 'task-popup-field--error': isError }"
                  autocomplete="off"
                  @input="clearError"
                />

                <textarea
                  v-model="description"
                  name="task-description"
                  placeholder="description"
                  class="task-popup-field task-popup-field--textarea"
                />
              </div>
            </div>

            <div class="task-popup-meta">
              <div class="task-popup-meta-row">
                <span class="task-popup-meta-label">Deadline</span>
                <input
                  :value="deadlineInput"
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

              <div class="task-popup-meta-row">
                <span class="task-popup-meta-label">Class</span>
                <input
                  v-model="classValue"
                  type="text"
                  name="task-class"
                  placeholder="slovenčina"
                  class="task-popup-class"
                  autocomplete="off"
                />
              </div>
            </div>
          </div>

          <div class="task-popup-footer">
            <button
              type="submit"
              class="task-popup-submit"
              :disabled="isSubmitting || !title.trim()"
            >
              {{ isSubmitting ? 'Loading...' : 'Create task' }}
            </button>
            <p v-if="message" class="task-popup-error">{{ message }}</p>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

/* Figma 1731:6330 — content 539px + px-18 (72px) ≈ max-w-2xl card */
.task-popup-overlay {
  @apply fixed inset-0 z-100 flex items-center justify-center p-4;
}

.task-popup-backdrop {
  @apply absolute inset-0 bg-black/60 backdrop-blur-sm;
}

.task-popup-card {
  @apply relative z-1 box-border w-full max-w-2xl shrink-0 rounded-[10px] border-2 border-[#212121] bg-black px-18 pb-[39px] pt-[34px];
}

.task-popup-form {
  @apply flex w-full flex-col gap-[62px];
}

.task-popup-content {
  @apply flex w-full flex-col;
}

.task-popup-body {
  @apply flex w-full flex-col gap-11;
}

.task-popup-header {
  @apply flex w-full items-center justify-between gap-4;
}

.task-popup-title {
  @apply text-base font-medium leading-none tracking-wide text-white;
}

.task-popup-cancel {
  @apply shrink-0 border-0 bg-transparent text-sm font-medium leading-none tracking-wide text-[#ad2222] transition-colors hover:text-[#c42828];
}

.task-popup-fields {
  @apply flex w-full flex-col gap-[19px];
}

.task-popup-field {
  @apply box-border h-13 w-full rounded-[10px] border-0 bg-[#262626] px-6 py-0 text-sm font-medium leading-normal tracking-tight text-white outline-none transition-shadow placeholder:text-white/50 focus:ring-1 focus:ring-white/20;
}

.task-popup-field--textarea {
  @apply h-33 min-h-0 resize-none py-4;
}

.task-popup-field--error {
  @apply ring-2 ring-red-500;
}

.task-popup-meta {
  @apply mt-9 flex w-full flex-col gap-7;
}

.task-popup-meta-row {
  @apply flex w-full items-center;
}

.task-popup-meta-label {
  @apply w-[91px] shrink-0 text-xs tracking-[0.12px] text-white;
}

.task-popup-deadline {
  @apply box-border h-7 w-[117px] shrink-0 rounded-[10px] border-0 bg-[#1c1b1b] px-5 py-1.5 text-center text-xs tracking-[0.12px] text-white outline-none transition-shadow placeholder:text-white/40 focus:ring-1 focus:ring-white/20;
}

.task-popup-deadline--filled {
  @apply text-white;
}

.task-popup-deadline--error {
  @apply ring-2 ring-red-500;
}

.task-popup-deadline-hint {
  @apply -mt-4 pl-[91px] text-[10px] font-medium tracking-tight text-white/50;
}

.task-popup-deadline-hint--error {
  @apply text-red-400;
}

.task-popup-class {
  @apply box-border h-7 w-[117px] shrink-0 rounded-[10px] border-0 bg-[#3c6eec] px-5 py-1.5 text-center text-xs tracking-[0.12px] text-white outline-none transition-shadow placeholder:text-white/70 focus:ring-1 focus:ring-white/20;
}

.task-popup-footer {
  @apply flex w-full flex-col gap-3;
}

.task-popup-submit {
  @apply flex h-12 w-full items-center justify-center rounded-[10px] bg-white px-3 text-base font-medium leading-none tracking-wide text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40;
}

.task-popup-error {
  @apply text-center text-sm font-medium text-red-400;
}
</style>
