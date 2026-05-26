<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useFoldersStore, type Folder } from '@/stores/folders'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  folder: Folder | null
}>()

const foldersStore = useFoldersStore()

const name = ref('')
const description = ref('')
const originalName = ref('')
const originalDescription = ref('')
const isSubmitting = ref(false)
const isError = ref(false)
const message = ref('')

const isUnchanged = computed(() => {
  const trimmedName = name.value.trim()
  const trimmedDescription = description.value.trim()
  return (
    trimmedName === originalName.value &&
    trimmedDescription === (originalDescription.value ?? '')
  )
})

const resetForm = () => {
  name.value = ''
  description.value = ''
  originalName.value = ''
  originalDescription.value = ''
  isError.value = false
  message.value = ''
  isSubmitting.value = false
}

const prefillFromFolder = () => {
  if (!props.folder) return
  const folderName = props.folder.name
  const folderDescription = props.folder.description ?? ''
  name.value = folderName
  description.value = folderDescription
  originalName.value = folderName
  originalDescription.value = folderDescription
}

const close = () => {
  resetForm()
  open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) {
    prefillFromFolder()
    return
  }
  resetForm()
})

watch(
  () => props.folder,
  () => {
    if (open.value) prefillFromFolder()
  }
)

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && open.value) close()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})

const handleSubmit = async () => {
  const trimmed = name.value.trim()
  if (!trimmed || isSubmitting.value || isUnchanged.value || !props.folder) return

  isSubmitting.value = true
  isError.value = false
  message.value = ''

  try {
    await foldersStore.updateFolder(props.folder.id, {
      name: trimmed,
      description: description.value,
      originalDescription: props.folder.description,
    })
    close()
  } catch (err) {
    isError.value = true
    message.value =
      err instanceof Error ? err.message : 'Failed to update folder.'
  } finally {
    isSubmitting.value = false
  }
}

const clearError = () => {
  isError.value = false
  message.value = ''
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && folder"
      class="folder-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-folder-popup-title"
    >
      <div
        class="folder-popup-backdrop"
        aria-hidden="true"
        @click="close"
      />

      <div class="folder-popup-card" @click.stop>
        <form class="folder-popup-form" @submit.prevent="handleSubmit">
          <div class="folder-popup-body">
            <div class="folder-popup-header">
              <h2 id="edit-folder-popup-title" class="folder-popup-title">
                Edit folder
              </h2>
              <button
                type="button"
                class="folder-popup-cancel"
                @click="close"
              >
                cancel
              </button>
            </div>

            <div class="folder-popup-fields">
              <input
                v-model="name"
                type="text"
                name="folder-name"
                placeholder="Folder name"
                class="folder-popup-field"
                :class="{ 'folder-popup-field--error': isError }"
                autocomplete="off"
                @input="clearError"
              />

              <textarea
                v-model="description"
                name="folder-description"
                placeholder="description"
                class="folder-popup-field folder-popup-field--textarea"
                @input="clearError"
              />
            </div>
          </div>

          <div class="folder-popup-footer">
            <button
              type="submit"
              class="folder-popup-submit"
              :disabled="isSubmitting || !name.trim() || isUnchanged"
            >
              {{ isSubmitting ? 'Loading...' : 'Save changes' }}
            </button>
            <p v-if="message" class="folder-popup-error">{{ message }}</p>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.folder-popup-overlay {
  @apply fixed inset-0 z-100 flex items-center justify-center p-4;
}

.folder-popup-backdrop {
  @apply absolute inset-0 bg-black/60 backdrop-blur-sm;
}

.folder-popup-card {
  @apply relative z-1 box-border w-full max-w-2xl shrink-0 rounded-xl border-2 border-neutral-900 bg-black px-18 pb-10 pt-9.5;
}

.folder-popup-form {
  @apply flex w-full flex-col gap-20;
}

.folder-popup-body {
  @apply flex w-full flex-col gap-11;
}

.folder-popup-header {
  @apply flex w-full items-center justify-between gap-4;
}

.folder-popup-title {
  @apply text-base font-medium leading-none tracking-wide text-white;
}

.folder-popup-cancel {
  @apply shrink-0 text-sm font-medium leading-none tracking-wide text-white/50 transition-colors hover:text-white;
}

.folder-popup-fields {
  @apply flex w-full flex-col gap-5;
}

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

.folder-popup-footer {
  @apply flex w-full flex-col gap-3;
}

.folder-popup-submit {
  @apply flex w-full items-center justify-center rounded-xl bg-white px-3 py-4 text-base font-medium leading-none tracking-wide text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40;
}

.folder-popup-error {
  @apply text-center text-sm font-medium text-red-400;
}
</style>
