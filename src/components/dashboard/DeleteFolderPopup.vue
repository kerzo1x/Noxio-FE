<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

const resetForm = () => {
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

const handleDelete = async () => {
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
  <Teleport to="body">
    <div
      v-if="open && folder"
      class="delete-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-folder-popup-message"
    >
      <div
        class="delete-popup-backdrop"
        aria-hidden="true"
        @click="close"
      />

      <div class="delete-popup-card" @click.stop>
        <p id="delete-folder-popup-message" class="delete-popup-message">
          Are you sure you want to delete your folder with all content inside?
        </p>

        <div class="delete-popup-actions">
          <button
            type="button"
            class="delete-popup-btn delete-popup-btn--cancel"
            @click="close"
          >
            Cancel
          </button>
          <button
            type="button"
            class="delete-popup-btn delete-popup-btn--delete"
            :disabled="isSubmitting"
            @click="handleDelete"
          >
            {{ isSubmitting ? 'Loading...' : 'Delete' }}
          </button>
        </div>

        <p v-if="message" class="delete-popup-error">{{ message }}</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

/* Figma 1948:6602 — fixed padding & controls; card width from content (w-fit) */
.delete-popup-overlay {
  @apply fixed inset-0 z-100 flex items-center justify-center p-4;
}

.delete-popup-backdrop {
  @apply absolute inset-0 bg-black/60 backdrop-blur-sm;
}

.delete-popup-card {
  @apply relative z-1 box-border w-fit max-w-[calc(100vw-2rem)] shrink-0 rounded-[10px] border-2 border-[#212121] bg-black px-[88px] py-[75px];
}

.delete-popup-message {
  @apply text-base font-medium leading-none tracking-[0.5px] text-white/75;
}

.delete-popup-actions {
  @apply mt-[66px] flex items-center justify-center gap-5;
}

.delete-popup-btn {
  @apply flex h-12 shrink-0 items-center justify-center rounded-[10px] px-7 text-base font-medium leading-[1.1] transition-opacity disabled:cursor-not-allowed disabled:opacity-40;
}

.delete-popup-btn--cancel {
  @apply min-w-[91px] bg-white text-black hover:opacity-90;
}

.delete-popup-btn--delete {
  @apply min-w-[224px] bg-[#ad2222] px-[92px] text-white hover:bg-[#c42828];
}

.delete-popup-error {
  @apply mt-4 text-center text-sm font-medium text-red-400;
}
</style>
