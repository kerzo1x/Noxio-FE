<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DeleteConfirmPopup from '@/components/dashboard/DeleteConfirmPopup.vue'
import { useFoldersStore, type Folder } from '@/stores/folders'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  folder: Folder | null
}>()

const emit = defineEmits<{
  deleted: [folderId: string]
}>()

const route = useRoute()
const router = useRouter()
const foldersStore = useFoldersStore()

const isSubmitting = ref(false)
const message = ref('')

function resetForm() {
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

// TODO: toto je v kazdom komponente a dal by som to do spolocneho useEscapeKey
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

async function handleDelete() {
  if (isSubmitting.value || !props.folder) return

  isSubmitting.value = true
  message.value = ''

  const folderId = props.folder.id

  try {
    await foldersStore.deleteFolder(folderId)
    emit('deleted', folderId)

    if (
      route.name === 'DashboardFolderNotes' &&
      route.params.folderId === folderId
    ) {
      await router.push({ name: 'DashboardFolders' })
    }

    close()
  } catch (err) {
    message.value =
      err instanceof Error ? err.message : 'Failed to delete folder.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <DeleteConfirmPopup
    v-if="folder"
    v-model="open"
    title-id="delete-folder-popup-message"
    message="Are you sure you want to delete your folder with all content inside?"
    :error-message="message"
    :is-submitting="isSubmitting"
    @confirm="handleDelete"
    @close="close"
  />
</template>
