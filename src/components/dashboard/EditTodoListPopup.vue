<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import PopupShell from '@/components/ui/PopupShell.vue'
import ColorSwatchRow from '@/components/ui/color/ColorSwatchRow.vue'
import { normalizeHex } from '@/utils/colorUtils'
import { useTodoListsStore, type TodoList } from '@/stores/todoLists'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  todoList: TodoList | null
}>()

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
const originalName = ref('')
const originalDescription = ref('')
const originalColorHex = ref<string>(DEFAULT_HEX)

const isSubmitting = ref(false)
const isError = ref(false)
const message = ref('')
const pickerOpen = ref(false)

const isUnchanged = computed(() => {
  const trimmedName = name.value.trim()
  const trimmedDescription = description.value.trim()
  return (
    trimmedName === originalName.value &&
    trimmedDescription === originalDescription.value &&
    normalizeHex(colorHex.value, DEFAULT_HEX) ===
      normalizeHex(originalColorHex.value, DEFAULT_HEX)
  )
})

function resetForm() {
  name.value = ''
  description.value = ''
  colorHex.value = DEFAULT_HEX
  originalName.value = ''
  originalDescription.value = ''
  originalColorHex.value = DEFAULT_HEX
  isError.value = false
  message.value = ''
  isSubmitting.value = false
  pickerOpen.value = false
}

function loadTodoListIntoForm() {
  if (!props.todoList) return
  const listName = props.todoList.name
  const listDescription = props.todoList.description ?? ''
  let listColor: string = DEFAULT_HEX
  if (props.todoList.color) {
    listColor = normalizeHex(props.todoList.color, DEFAULT_HEX)
  }

  name.value = listName
  description.value = listDescription
  colorHex.value = listColor
  originalName.value = listName
  originalDescription.value = listDescription
  originalColorHex.value = listColor
}

function close() {
  resetForm()
  open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) {
    loadTodoListIntoForm()
    return
  }
  resetForm()
})

watch(
  () => props.todoList,
  () => {
    if (open.value) loadTodoListIntoForm()
  },
)

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
  if (!trimmed || isSubmitting.value || isUnchanged.value || !props.todoList) return

  isSubmitting.value = true
  isError.value = false
  message.value = ''

  try {
    await todoListsStore.updateTodoList(props.todoList.id, {
      name: trimmed,
      description: description.value,
      color: colorHex.value,
      originalName: originalName.value,
      originalDescription: props.todoList.description,
      originalColor: props.todoList.color,
    })
    close()
  } catch (err) {
    isError.value = true
    message.value =
      err instanceof Error ? err.message : 'Failed to update todo list.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <PopupShell
    v-if="open && todoList"
    aria-labelledby="edit-todo-list-popup-title"
    @close="close"
  >
    <div class="modal-form-card modal-form-card--picker" @click.stop>
      <form class="modal-form-form" @submit.prevent="handleSubmit">
        <div class="modal-form-body">
          <div class="modal-form-header">
            <h2 id="edit-todo-list-popup-title" class="modal-form-title">
              Edit to do list
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
            :disabled="isSubmitting || !name.trim() || isUnchanged"
          >
            {{ isSubmitting ? 'Loading...' : 'Save changes' }}
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
