<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import PopupShell from '@/components/ui/PopupShell.vue'
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

function resetForm() {
  name.value = ''
  description.value = ''
  colorHex.value = DEFAULT_HEX
  isError.value = false
  message.value = ''
  isSubmitting.value = false
  pickerOpen.value = false
}

function close() {
  resetForm()
  open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) resetForm()
})

function onKeydown(e: KeyboardEvent) {
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

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

function clearError() {
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
  <PopupShell
    v-if="open"
    aria-labelledby="add-todo-list-popup-title"
    @close="close"
  >
    <div class="modal-form-card modal-form-card--picker" @click.stop>
      <form class="modal-form-form" @submit.prevent="handleSubmit">
        <div class="modal-form-body">
          <div class="modal-form-header">
            <h2 id="add-todo-list-popup-title" class="modal-form-title">
              Create to do list
            </h2>
            <button type="button" class="modal-form-cancel" @click="close">
              Cancel
            </button>
          </div>

          <div class="flex w-full flex-col gap-5">
            <input
              v-model="name"
              type="text"
              name="todo-list-name"
              placeholder="To do list name"
              class="folder-popup-field"
              :class="{ 'folder-popup-field--error': isError }"
              autocomplete="off"
              @input="clearError"
            />
            <textarea
              v-model="description"
              name="todo-list-description"
              placeholder="Description"
              class="folder-popup-field folder-popup-field--textarea"
            />
          </div>

          <ColorSwatchRow
            v-model="colorHex"
            v-model:picker-open="pickerOpen"
            :presets="PRESET_COLORS"
            size="lg"
            picker-panel-class="todo-list-picker-panel"
          />
        </div>

        <div class="modal-form-footer">
          <button
            type="submit"
            class="modal-form-submit"
            :disabled="isSubmitting || !name.trim()"
          >
            {{ isSubmitting ? 'Loading...' : 'Create to do list' }}
          </button>
          <p v-if="message" class="modal-form-error">{{ message }}</p>
        </div>
      </form>
    </div>
  </PopupShell>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.folder-popup-field {
  @apply box-border w-full rounded-xl border-0 bg-neutral-800 px-6 text-sm font-medium leading-normal tracking-tight text-white outline-none transition-shadow placeholder:text-white/50 focus:ring-1 focus:ring-white/20;
  @apply h-13 py-0;
}

.folder-popup-field--textarea {
  @apply h-33 min-h-0 resize-none py-4;
}

.folder-popup-field--error {
  @apply ring-2 ring-red-500;
}

:deep(.todo-list-picker-panel) {
  @apply absolute z-30;
}
</style>
