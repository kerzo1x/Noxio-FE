<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace'
import BaseInput from '@/components/ui/inputs/BaseInput.vue'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'

const workspaceStore = useWorkspaceStore()

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
  workspaceStore.closeCreateWorkspacePopup()
}

watch(
  () => workspaceStore.showCreateWorkspacePopup,
  (open) => {
    if (open) resetForm()
  }
)

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && workspaceStore.showCreateWorkspacePopup) close()
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

  isSubmitting.value = true
  isError.value = false
  message.value = ''

  try {
    await workspaceStore.createWorkspace(trimmed)
    close()
  } catch (err) {
    isError.value = true
    message.value =
      err instanceof Error ? err.message : 'Failed to create workspace.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="workspaceStore.showCreateWorkspacePopup"
      class="workspace-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-popup-title"
    >
      <div class="workspace-popup-backdrop" aria-hidden="true" @click="close" />
      <div class="workspace-popup-card" @click.stop>
        <h2 id="workspace-popup-title" class="workspace-popup-title">
          New workspace
        </h2>

        <form class="workspace-popup-form" @submit.prevent="handleSubmit">
          <base-input
            v-model="name"
            type="text"
            label="Name"
            name="workspace-name"
            place-holder="Workspace name"
            :is-error="isError"
            @clear-error="isError = false; message = ''"
          />

          <p v-if="message" class="workspace-popup-error">{{ message }}</p>

          <div class="workspace-popup-actions">
            <button type="button" class="btn-back" @click="close">Back</button>
            <base-button
              class="btn-create"
              :is-loading="isSubmitting"
              text="Create workspace"
            />
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.workspace-popup-overlay {
  @apply fixed inset-0 z-[100] flex items-center justify-center p-6;
}

.workspace-popup-backdrop {
  @apply absolute inset-0 bg-black/60 backdrop-blur-sm;
}

.workspace-popup-card {
  @apply relative z-[1] w-full max-w-md rounded-auth border border-panel-input-border bg-panel-bg p-8 shadow-2xl;
}

.workspace-popup-title {
  @apply text-2xl font-bold text-panel-text mb-6;
}

.workspace-popup-form {
  @apply flex flex-col gap-4;
}

.workspace-popup-error {
  @apply text-sm text-error font-medium;
}

.workspace-popup-actions {
  @apply flex gap-3 mt-2;
}

.btn-back {
  @apply w-24 py-3 rounded-auth font-semibold text-panel-label border border-panel-input-border hover:bg-white/5 hover:text-panel-text hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer shrink-0;
}

:deep(.btn-base) {
  @apply flex-1;
}
</style>
