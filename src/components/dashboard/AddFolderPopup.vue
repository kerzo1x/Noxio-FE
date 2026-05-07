<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { useFoldersStore } from '@/stores/folders'
import BaseInput from '@/components/ui/inputs/BaseInput.vue'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'

const open = defineModel<boolean>({ default: false })

const workspaceStore = useWorkspaceStore()
const foldersStore = useFoldersStore()

const name = ref('')
const isSubmitting = ref(false)
const isError = ref(false)
const message = ref('')

const resetForm = () => {
  name.value = ''
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
    await foldersStore.createFolder(workspaceId, trimmed)
    close()
  } catch (err) {
    isError.value = true
    message.value =
      err instanceof Error ? err.message : 'Failed to create folder.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="add-folder-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-folder-popup-title"
    >
      <div class="add-folder-popup-backdrop" aria-hidden="true" @click="close" />
      <div class="add-folder-popup-card" @click.stop>
        <h2 id="add-folder-popup-title" class="add-folder-popup-title">
          New folder
        </h2>

        <form class="add-folder-popup-form" @submit.prevent="handleSubmit">
          <base-input
            v-model="name"
            type="text"
            label="Name"
            name="folder-name"
            place-holder="Folder name"
            :is-error="isError"
            @clear-error="isError = false; message = ''"
          />

          <p v-if="message" class="add-folder-popup-error">{{ message }}</p>

          <div class="add-folder-popup-actions">
            <button type="button" class="btn-back" @click="close">Back</button>
            <base-button
              class="btn-create"
              :is-loading="isSubmitting"
              text="Create folder"
            />
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.add-folder-popup-overlay {
  @apply fixed inset-0 z-[100] flex items-center justify-center p-6;
}

.add-folder-popup-backdrop {
  @apply absolute inset-0 bg-black/60 backdrop-blur-sm;
}

.add-folder-popup-card {
  @apply relative z-[1] w-full max-w-md rounded-auth border border-panel-input-border bg-panel-bg p-8 shadow-2xl;
}

.add-folder-popup-title {
  @apply text-2xl font-bold text-panel-text mb-6;
}

.add-folder-popup-form {
  @apply flex flex-col gap-4;
}

.add-folder-popup-error {
  @apply text-sm text-error font-medium;
}

.add-folder-popup-actions {
  @apply flex gap-3 mt-2;
}

.btn-back {
  @apply w-24 py-3 rounded-auth font-semibold text-panel-label border border-panel-input-border hover:bg-white/5 hover:text-panel-text hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer shrink-0;
}

:deep(.btn-base) {
  @apply flex-1;
}
</style>
