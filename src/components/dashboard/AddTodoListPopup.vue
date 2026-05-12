<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { useTodoListsStore } from '@/stores/todoLists'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'

const open = defineModel<boolean>({ default: false })

const workspaceStore = useWorkspaceStore()
const todoListsStore = useTodoListsStore()

const DEFAULT_HEX = '#E89623'

const name = ref('')
const description = ref('')
const colorHex = ref(DEFAULT_HEX)
const colorInputRef = ref<HTMLInputElement | null>(null)

const isSubmitting = ref(false)
const isError = ref(false)
const message = ref('')

const rgbParts = computed(() => {
  const hex = colorHex.value.replace('#', '')
  if (hex.length !== 6) {
    return { r: 0, g: 0, b: 0 }
  }
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) {
    return { r: 0, g: 0, b: 0 }
  }
  return { r, g, b }
})

const displayHex = computed(() => colorHex.value.toUpperCase())

const resetForm = () => {
  name.value = ''
  description.value = ''
  colorHex.value = DEFAULT_HEX
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

const openNativeColorPicker = () => {
  colorInputRef.value?.click()
}

const onColorInput = (e: Event) => {
  const el = e.target as HTMLInputElement
  colorHex.value = el.value.toUpperCase()
}

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
      color: colorHex.value
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
      class="add-todo-list-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-todo-list-popup-title"
    >
      <div
        class="add-todo-list-popup-backdrop"
        aria-hidden="true"
        @click="close"
      />
      <div class="add-todo-list-popup-card" @click.stop>
        <form class="add-todo-list-popup-form" @submit.prevent="handleSubmit">
          <h2 id="add-todo-list-popup-title" class="sr-only">New to do list</h2>

          <input
            v-model="name"
            type="text"
            name="todo-list-name"
            placeholder="To do list name"
            class="popup-input"
            :class="{ 'popup-input-error': isError }"
            autocomplete="off"
            @input="clearError"
          />

          <textarea
            v-model="description"
            name="todo-list-description"
            placeholder="Desctription"
            class="popup-description"
          />

          <input
            ref="colorInputRef"
            v-model="colorHex"
            type="color"
            class="sr-only"
            tabindex="-1"
            aria-label="Pick list color"
            @input="onColorInput"
          />

          <button
            type="button"
            class="color-row"
            aria-label="Open color picker"
            @click="openNativeColorPicker"
          >
            <span
              class="color-swatch"
              :style="{ backgroundColor: displayHex }"
              aria-hidden="true"
            />
            <span class="color-row-values">
              <span class="color-hex">{{ displayHex }}</span>
              <span class="color-rgb">
                <span>R {{ rgbParts.r }}</span>
                <span>G {{ rgbParts.g }}</span>
                <span>B {{ rgbParts.b }}</span>
              </span>
            </span>
          </button>

          <div class="popup-button-wrap">
            <base-button
              class="popup-create-button"
              :is-loading="isSubmitting"
              text="Create folder"
            />
          </div>
          <p v-if="message" class="add-todo-list-popup-error">{{ message }}</p>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.add-todo-list-popup-overlay {
  @apply fixed inset-0 z-100 flex items-center justify-center p-6;
}

.add-todo-list-popup-backdrop {
  @apply absolute inset-0 bg-black/60 backdrop-blur-sm;
}

.add-todo-list-popup-card {
  @apply relative z-1 box-border flex w-[578px] max-w-[calc(100vw-3rem)] flex-col rounded-[22px] border border-white/10 shadow-2xl;
  min-height: 587px;
  background-color: #1a1a1a;
}

.add-todo-list-popup-form {
  @apply flex w-full flex-1 flex-col items-center px-[19.5px] pb-10 pt-[64px];
}

.popup-input {
  @apply h-[52px] w-[539px] max-w-full rounded-[10px] border border-white/10 px-[20px] text-[16px] font-semibold text-white placeholder:text-[#7D7D7D] focus:outline-none;
  background-color: #262626;
}

.popup-input-error {
  @apply border-red-500;
}

.popup-description {
  @apply mt-[28px] h-[205px] w-[539px] max-w-full resize-none rounded-[10px] border border-white/10 px-[20px] py-[17px] text-[16px] font-semibold text-white placeholder:text-[#7D7D7D] focus:outline-none;
  background-color: #262626;
}

.color-row {
  @apply mt-[28px] flex h-[83px] w-[539px] max-w-full cursor-pointer items-center gap-4 rounded-[10px] border border-white/10 px-[64px] text-left transition-colors hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30;
  background-color: #262626;
}

.color-swatch {
  @apply h-10 w-10 shrink-0 rounded-[8px] border border-white/10;
}

.color-row-values {
  @apply flex min-w-0 flex-1 flex-row items-center justify-between gap-4;
}

.color-hex {
  @apply text-[16px] font-semibold tracking-wide text-white;
}

.color-rgb {
  @apply flex flex-wrap gap-x-6 gap-y-1 text-[16px] font-semibold text-white;
}

.popup-button-wrap {
  @apply mt-[40px] w-[460px] max-w-full;
}

.popup-create-button {
  @apply h-[56px]! w-full! rounded-[14px]! text-[16px]! font-semibold! leading-[100%]!;
}

.add-todo-list-popup-error {
  @apply mt-3 text-sm font-medium text-red-400;
}
</style>
