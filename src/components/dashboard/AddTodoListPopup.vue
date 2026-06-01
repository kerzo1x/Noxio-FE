<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import ColorSwatchRow from '@/components/ui/color/ColorSwatchRow.vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { useTodoListsStore } from '@/stores/todoLists'

const open = defineModel<boolean>({ default: false })

const workspaceStore = useWorkspaceStore()
const todoListsStore = useTodoListsStore()

const PRESET_COLORS = [
  '#E89623',
  '#AD2222',
  '#E85102',
  '#23A0E8',
  '#F900FD',
] as const

const DEFAULT_HEX = PRESET_COLORS[0]

const name = ref('')
const description = ref('')
const colorHex = ref<string>(DEFAULT_HEX)

const isSubmitting = ref(false)
const isError = ref(false)
const message = ref('')

const pickerOpen = ref(false)

const resetForm = () => {
  name.value = ''
  description.value = ''
  colorHex.value = DEFAULT_HEX
  isError.value = false
  message.value = ''
  isSubmitting.value = false
  pickerOpen.value = false
}

const close = () => {
  resetForm()
  open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) resetForm()
})

const onKeydown = (e: KeyboardEvent) => {
  if (!open.value) return
  if (e.key === 'Escape') {
    if (pickerOpen.value) {
      pickerOpen.value = false
      e.stopPropagation()
      return
    }
    close()
  }
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

const handleSubmit = async () => {
  const trimmed = name.value.trim()
  if (!trimmed || isSubmitting.value) return

  const workspaceId = workspaceStore.activeWorkspace?.id
  if (!workspaceId) {
    isError.value = true
    message.value = 'No workspace selected.'
    return
  }

  isSubmitting.value = true
  isError.value = false
  message.value = ''

  try {
    await todoListsStore.createTodoList(workspaceId, {
      name: trimmed,
      description: description.value,
      color: colorHex.value,
    })
    close()
  } catch (err) {
    isError.value = true
    message.value =
      err instanceof Error ? err.message : 'Failed to create todo list.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="todo-list-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-todo-list-popup-title"
    >
      <div
        class="todo-list-popup-backdrop"
        aria-hidden="true"
        @click="close"
      />

      <div class="todo-list-popup-card" @click.stop>
        <form class="todo-list-popup-form" @submit.prevent="handleSubmit">
          <div class="todo-list-popup-body">
            <div class="todo-list-popup-header">
              <h2 id="add-todo-list-popup-title" class="todo-list-popup-title">
                Create to do list
              </h2>
              <button
                type="button"
                class="todo-list-popup-cancel"
                @click="close"
              >
                Cancel
              </button>
            </div>

            <div class="todo-list-popup-fields">
              <input
                v-model="name"
                type="text"
                name="todo-list-name"
                placeholder="To do list name"
                class="todo-list-popup-field"
                :class="{ 'todo-list-popup-field--error': isError }"
                autocomplete="off"
                @input="clearError"
              />

              <textarea
                v-model="description"
                name="todo-list-description"
                placeholder="Description"
                class="todo-list-popup-field todo-list-popup-field--textarea"
              />
            </div>

            <ColorSwatchRow
              v-model="colorHex"
              v-model:picker-open="pickerOpen"
              :presets="PRESET_COLORS"
              size="lg"
              picker-panel-class="todo-list-popup-picker-panel"
            />
          </div>

          <div class="todo-list-popup-footer">
            <button
              type="submit"
              class="todo-list-popup-submit"
              :disabled="isSubmitting || !name.trim()"
            >
              {{ isSubmitting ? 'Loading...' : 'Create to do list' }}
            </button>
            <p v-if="message" class="todo-list-popup-error">{{ message }}</p>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

/* Figma 1727:6065 popup, 1727:6066 placement, 1727:6294 picker */
.todo-list-popup-overlay {
  @apply fixed inset-0 z-100 flex items-center justify-center p-4;
}

.todo-list-popup-backdrop {
  @apply absolute inset-0 bg-black/60 backdrop-blur-sm;
}

.todo-list-popup-card {
  @apply relative z-1 box-border w-full max-w-2xl shrink-0 overflow-visible rounded-xl border-2 border-neutral-900 bg-black px-18 pb-10 pt-9.5;
}

.todo-list-popup-form {
  @apply flex w-full flex-col gap-20;
}

.todo-list-popup-body {
  @apply flex w-full flex-col gap-11;
}

.todo-list-popup-header {
  @apply flex w-full items-center justify-between gap-4;
}

.todo-list-popup-title {
  @apply text-base font-medium leading-none tracking-wide text-white;
}

.todo-list-popup-cancel {
  @apply shrink-0 text-sm font-medium leading-none tracking-wide text-white/50 transition-colors hover:text-white;
}

.todo-list-popup-fields {
  @apply flex w-full flex-col gap-5;
}

.todo-list-popup-field {
  @apply box-border w-full rounded-xl border-0 bg-neutral-800 px-6 text-sm font-medium leading-normal tracking-tight text-white outline-none transition-shadow placeholder:text-white/50 focus:ring-1 focus:ring-white/20;
  @apply h-13 py-0;
}

.todo-list-popup-field--textarea {
  @apply h-33 min-h-0 resize-none py-4;
}

.todo-list-popup-field--error {
  @apply ring-2 ring-red-500;
}

:deep(.todo-list-popup-picker-panel) {
  @apply left-[349px] top-[89px];
}

.todo-list-popup-footer {
  @apply flex w-full flex-col gap-3;
}

.todo-list-popup-submit {
  @apply flex w-full items-center justify-center rounded-xl bg-white px-3 py-4 text-base font-medium leading-none tracking-wide text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40;
}

.todo-list-popup-error {
  @apply text-center text-sm font-medium text-red-400;
}
</style>
