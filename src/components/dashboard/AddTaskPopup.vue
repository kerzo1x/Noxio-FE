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
const deadlineDate = ref('')
const classValue = ref('')

const isSubmitting = ref(false)
const isError = ref(false)
const message = ref('')

const resetForm = () => {
  title.value = ''
  description.value = ''
  deadlineDate.value = ''
  classValue.value = ''
  isError.value = false
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
  message.value = ''
}

const formattedDeadline = computed(() => {
  if (!deadlineDate.value) return null
  const [year, month, day] = deadlineDate.value.split('-').map(Number)
  if (!year || !month || !day) return null
  return `${day}.${month}.${year}`
})

function deadlineToIso(dateStr: string): string | null {
  if (!dateStr) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day, 23, 59, 59, 999)
  return date.toISOString()
}

const handleSubmit = async () => {
  const trimmed = title.value.trim()
  if (!trimmed || isSubmitting.value) return

  if (!props.todoListId) {
    isError.value = true
    message.value = 'Todo list not found.'
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
      deadlineAt: deadlineToIso(deadlineDate.value),
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

            <div class="task-popup-meta">
              <div class="task-popup-meta-row">
                <span class="task-popup-meta-label">Deadline</span>
                <label class="task-popup-deadline">
                  <span v-if="formattedDeadline" class="task-popup-deadline-text">
                    {{ formattedDeadline }}
                  </span>
                  <span v-else class="task-popup-deadline-placeholder">—</span>
                  <input
                    v-model="deadlineDate"
                    type="date"
                    class="task-popup-deadline-input"
                    aria-label="Deadline"
                  />
                </label>
              </div>

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

.task-popup-overlay {
  @apply fixed inset-0 z-100 flex items-center justify-center p-4;
}

.task-popup-backdrop {
  @apply absolute inset-0 bg-black/60 backdrop-blur-sm;
}

.task-popup-card {
  @apply relative z-1 box-border w-full max-w-2xl shrink-0 rounded-xl border-2 border-neutral-900 bg-black px-18 pb-10 pt-9.5;
}

.task-popup-form {
  @apply flex w-full flex-col gap-20;
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
  @apply shrink-0 border-0 bg-transparent text-sm font-medium leading-none tracking-wide text-red-400 transition-colors hover:text-red-300;
}

.task-popup-fields {
  @apply flex w-full flex-col gap-5;
}

.task-popup-field {
  @apply box-border w-full rounded-xl border-0 bg-neutral-800 px-6 text-sm font-medium leading-normal tracking-tight text-white outline-none transition-shadow placeholder:text-white/50 focus:ring-1 focus:ring-white/20;
  @apply h-13 py-0;
}

.task-popup-field--textarea {
  @apply h-33 min-h-0 resize-none py-4;
}

.task-popup-field--error {
  @apply ring-2 ring-red-500;
}

.task-popup-meta {
  @apply flex w-full flex-col gap-5;
}

.task-popup-meta-row {
  @apply flex w-full items-center justify-between gap-4;
}

.task-popup-meta-label {
  @apply text-sm font-medium tracking-tight text-white;
}

.task-popup-deadline {
  @apply relative flex h-9 min-w-[100px] cursor-pointer items-center justify-center rounded-lg bg-neutral-800 px-4;
}

.task-popup-deadline-text,
.task-popup-deadline-placeholder {
  @apply pointer-events-none text-xs font-medium tracking-tight text-white;
}

.task-popup-deadline-placeholder {
  @apply text-white/40;
}

.task-popup-deadline-input {
  @apply absolute inset-0 cursor-pointer opacity-0;
}

.task-popup-class {
  @apply box-border h-9 max-w-[140px] rounded-full border-0 bg-[#6584e2] px-5 text-center text-xs font-medium tracking-tight text-white outline-none transition-shadow placeholder:text-white/70 focus:ring-1 focus:ring-white/20;
}

.task-popup-footer {
  @apply flex w-full flex-col gap-3;
}

.task-popup-submit {
  @apply flex w-full items-center justify-center rounded-xl bg-white px-3 py-4 text-base font-medium leading-none tracking-wide text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40;
}

.task-popup-error {
  @apply text-center text-sm font-medium text-red-400;
}
</style>
