<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import PopupShell from '@/components/ui/PopupShell.vue'
import FolderFormFields from '@/components/dashboard/FolderFormFields.vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { useFoldersStore } from '@/stores/folders'

const open = defineModel<boolean>({ default: false })

const workspaceStore = useWorkspaceStore()
const foldersStore = useFoldersStore()

const name = ref('')
const description = ref('')
const isSubmitting = ref(false)
const isError = ref(false)
const message = ref('')

function resetForm() {
  name.value = ''
  description.value = ''
  isError.value = false
  message.value = ''
  isSubmitting.value = false
}

function close() {
  resetForm()
  open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) resetForm()
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) close()
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
  <PopupShell
    v-if="open"
    aria-labelledby="add-folder-popup-title"
    @close="close"
  >
    <div class="modal-form-card" @click.stop>
      <form class="modal-form-form" @submit.prevent="handleSubmit">
        <div class="modal-form-body">
          <div class="modal-form-header">
            <h2 id="add-folder-popup-title" class="modal-form-title">
              Create new folder
            </h2>
            <button type="button" class="modal-form-cancel" @click="close">
              Cancel
            </button>
          </div>

          <FolderFormFields
            v-model:name="name"
            v-model:description="description"
            :is-error="isError"
            @clear-error="clearError"
          />
        </div>

        <div class="modal-form-footer">
          <button
            type="submit"
            class="modal-form-submit"
            :disabled="isSubmitting || !name.trim()"
          >
            {{ isSubmitting ? 'Loading...' : 'Create folder' }}
          </button>
          <p v-if="message" class="modal-form-error">{{ message }}</p>
        </div>
      </form>
    </div>
  </PopupShell>
</template>
