<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useEscapeKey } from '@/composables/useEscapeKey'
import { useTaskForm } from '@/composables/useTaskForm'
import TaskCategoryPicker from '@/components/dashboard/tasks/TaskCategoryPicker.vue'
import TaskDeadlineField from '@/components/dashboard/tasks/TaskDeadlineField.vue'
import TaskFormFields from '@/components/dashboard/tasks/TaskFormFields.vue'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  todoListId: string
}>()

const {
  title,
  description,
  deadline,
  isSubmitting,
  isError,
  message,
  showDeadlineError,
  reset,
  clearError,
  submit,
} = useTaskForm()

const selectedCategoryId = ref<string | null>(null)
const categoryDropdownOpen = ref(false)
const createCategoryOpen = ref(false)
const categoryPickerOpen = ref(false)

const categoryPickerRef = ref<InstanceType<typeof TaskCategoryPicker> | null>(
  null,
)

const resetForm = () => {
  reset()
  selectedCategoryId.value = null
  categoryDropdownOpen.value = false
  createCategoryOpen.value = false
  categoryPickerOpen.value = false
  categoryPickerRef.value?.reset()
}

const close = () => {
  resetForm()
  open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})

useEscapeKey(() => {
  if (categoryPickerOpen.value) {
    categoryPickerOpen.value = false
    return
  }
  if (createCategoryOpen.value) {
    createCategoryOpen.value = false
    return
  }
  if (categoryDropdownOpen.value) {
    categoryDropdownOpen.value = false
    return
  }
  close()
}, () => open.value)

function onDocumentPointerDown(e: PointerEvent) {
  const picker = categoryPickerRef.value
  if (!picker || !open.value || categoryPickerOpen.value) return

  const target = e.target as Node

  if (createCategoryOpen.value) {
    if (picker.createCategoryPanelRef?.contains(target)) return
    if (picker.categoryDropdownRef?.contains(target)) return
    if (picker.categoryTriggerRef?.contains(target)) return
    createCategoryOpen.value = false
    return
  }

  if (categoryDropdownOpen.value) {
    if (picker.categoryDropdownRef?.contains(target)) return
    if (picker.categoryTriggerRef?.contains(target)) return
    categoryDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
})

function onCategoryError(errorMessage: string) {
  isError.value = true
  message.value = errorMessage
}

const handleSubmit = async () => {
  const success = await submit(props.todoListId, selectedCategoryId.value)
  if (success) {
    close()
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

              <TaskFormFields
                v-model:title="title"
                v-model:description="description"
                :is-error="isError"
                @clear-error="clearError"
              />
            </div>

            <div class="task-popup-meta">
              <TaskDeadlineField
                v-model="deadline"
                :show-deadline-error="showDeadlineError"
                @clear-error="clearError"
              />

              <TaskCategoryPicker
                ref="categoryPickerRef"
                v-model="selectedCategoryId"
                v-model:category-dropdown-open="categoryDropdownOpen"
                v-model:create-category-open="createCategoryOpen"
                v-model:category-picker-open="categoryPickerOpen"
                :todo-list-id="todoListId"
                @clear-error="clearError"
                @error="onCategoryError"
              />
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
  @apply relative z-1 box-border w-full max-w-2xl shrink-0 overflow-visible rounded-[10px] border-2 border-[#212121] bg-black px-18 pb-[39px] pt-[34px];
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

:deep(.task-popup-fields) {
  @apply flex w-full flex-col gap-5;
}

:deep(.task-popup-field) {
  @apply box-border h-13 w-full rounded-[10px] border-0 bg-[#262626] px-6 py-0 text-sm font-medium leading-normal tracking-tight text-white outline-none transition-shadow placeholder:text-white/50 focus:ring-1 focus:ring-white/20;
}

:deep(.task-popup-field--textarea) {
  @apply h-33 min-h-0 resize-none py-4;
}

:deep(.task-popup-field--error) {
  @apply ring-2 ring-red-500;
}

.task-popup-meta {
  @apply mt-9 flex w-full flex-col gap-7;
}

:deep(.task-popup-meta-row) {
  @apply flex w-full items-center;
}

:deep(.task-popup-meta-label) {
  @apply w-[91px] shrink-0 text-xs tracking-[0.12px] text-white;
}

:deep(.task-popup-deadline) {
  @apply box-border h-7 w-[117px] shrink-0 rounded-[10px] border-0 bg-[#1c1b1b] px-5 py-1.5 text-center text-xs tracking-[0.12px] text-white outline-none transition-shadow placeholder:text-white/40 focus:ring-1 focus:ring-white/20;
}

:deep(.task-popup-deadline--filled) {
  @apply text-white;
}

:deep(.task-popup-deadline--error) {
  @apply ring-2 ring-red-500;
}

:deep(.task-popup-deadline-hint) {
  @apply -mt-4 pl-[91px] text-[10px] font-medium tracking-tight text-white/50;
}

:deep(.task-popup-deadline-hint--error) {
  @apply text-red-400;
}

:deep(.task-popup-category-row) {
  @apply relative;
}

:deep(.task-popup-category-pill) {
  @apply box-border flex h-7 w-[117px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-0 px-5 py-1.5 text-center text-xs tracking-[0.12px] text-white outline-none transition-shadow focus-visible:ring-1 focus-visible:ring-white/20;
}

:deep(.task-popup-category-pill--placeholder) {
  @apply text-white/70;
}

:deep(.task-popup-category-dropdown) {
  @apply absolute left-[225px] top-0 z-20 flex w-[181px] flex-col items-center gap-2.5 rounded-[10px] border border-[#212121] bg-black px-8 pb-4 pt-5;
}

:deep(.task-popup-category-option) {
  @apply flex h-7 w-[117px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-0 px-5 py-1.5 text-center text-xs tracking-[0.12px] text-white transition-opacity hover:opacity-90;
}

:deep(.task-popup-category-dropdown-empty) {
  @apply w-full text-center text-[10px] text-white/50;
}

:deep(.task-popup-create-category-trigger) {
  @apply flex h-7 w-[117px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-0 bg-white px-4 py-1.5 text-[10px] tracking-[0.1px] text-black transition-opacity hover:opacity-90;
}

:deep(.task-popup-create-category) {
  @apply absolute left-[225px] top-0 z-20 flex w-[181px] flex-col items-center gap-2.5 rounded-[10px] border border-[#212121] bg-black px-8 pb-4 pt-5;
}

:deep(.task-popup-create-category-name) {
  @apply box-border h-7 w-[117px] shrink-0 rounded-[10px] border-0 bg-[#262626] px-4 py-0 text-[10px] font-medium tracking-tight text-white outline-none placeholder:text-white/50 focus:ring-1 focus:ring-white/20;
}

:deep(.task-popup-category-picker) {
  @apply left-[calc(100%+12px)] top-0;
}

:deep(.task-popup-create-category-submit) {
  @apply flex h-7 w-[117px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-0 bg-white px-4 py-1.5 text-[10px] tracking-[0.1px] text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40;
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
