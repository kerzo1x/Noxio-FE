<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import PopupShell from '@/components/ui/PopupShell.vue'
import FolderFormFields from '@/components/dashboard/FolderFormFields.vue'
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

function resetForm() {
  name.value = ''
  description.value = ''
  originalName.value = ''
  originalDescription.value = ''
  isError.value = false
  message.value = ''
  isSubmitting.value = false
}

function loadFolderIntoForm() {
  if (!props.folder) return
  const folderName = props.folder.name
  const folderDescription = props.folder.description ?? ''
  name.value = folderName
  description.value = folderDescription
  originalName.value = folderName
  originalDescription.value = folderDescription
}

function close() {
  resetForm()
  open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) {
    loadFolderIntoForm()
    return
  }
  resetForm()
})

watch(
  () => props.folder,
  () => {
    if (open.value) loadFolderIntoForm()
  },
)

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
</script>

<template>
  <PopupShell
    v-if="open && folder"
    aria-labelledby="edit-folder-popup-title"
    @close="close"
  >
    <div class="modal-form-card" @click.stop>
      <form class="modal-form-form" @submit.prevent="handleSubmit">
        <div class="modal-form-body">
          <div class="modal-form-header">
            <h2 id="edit-folder-popup-title" class="modal-form-title">
              Edit folder
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
