<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { useFoldersStore } from '@/stores/folders'
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

const clearError = () => {
  isError.value = false
  message.value = ''
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
        <form class="add-folder-popup-form" @submit.prevent="handleSubmit">
          <h2 id="add-folder-popup-title" class="sr-only">New folder</h2>

          <input
            v-model="name"
            type="text"
            name="folder-name"
            placeholder="Folder name:"
            class="popup-input mt-[19px]"
            :class="{ 'popup-input-error': isError }"
            autocomplete="off"
            @input="clearError"
          />

          <textarea
            name="folder-description"
            placeholder="Desctription:"
            class="popup-description mt-[28px]"
          />

          <div class="popup-button-wrap mt-[100px]">
            <base-button
              class="popup-create-button"
              :is-loading="isSubmitting"
              text="Create folder"
            />
          </div>
          <p v-if="message" class="add-folder-popup-error">{{ message }}</p>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.add-folder-popup-overlay {
  @apply fixed inset-0 z-100 flex items-center justify-center p-6;
}

.add-folder-popup-backdrop {
  @apply absolute inset-0 bg-black/60 backdrop-blur-sm;
}

.add-folder-popup-card {
  @apply relative z-1 h-[487px] w-[578px] rounded-[22px] border border-white/10 shadow-2xl;
  background-color: #1a1a1a;
}

.add-folder-popup-form {
  @apply flex h-full flex-col items-center;
}

.popup-input {
  @apply h-[52px] w-[539px] rounded-[10px] border border-white/10 px-[20px] text-[16px] font-semibold text-white placeholder:text-[#7D7D7D] focus:outline-none;
  background-color: #262626;
}

.popup-input-error {
  @apply border-red-500;
}

.popup-description {
  @apply h-[205px] w-[539px] resize-none rounded-[10px] border border-white/10 px-[20px] py-[17px] text-[16px] font-semibold text-white placeholder:text-[#7D7D7D] focus:outline-none;
  background-color: #262626;
}

.popup-button-wrap {
  @apply w-[460px];
}

.popup-create-button {
  @apply h-[56px]! w-full! rounded-[14px]! text-[16px]! font-semibold! leading-[100%]!;
}

.add-folder-popup-error {
  @apply mt-3 text-sm font-medium text-red-400;
}
</style>
