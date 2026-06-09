<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import FolderCardContextMenu from '@/components/dashboard/FolderCardContextMenu.vue'
import { useFoldersStore, type Folder } from '@/stores/folders'
import { useWorkspaceStore } from '@/stores/workspace'
import bigFolder from '@/assets/img/big-folder.svg'

const emit = defineEmits<{
  edit: [folder: Folder]
  delete: [folder: Folder]
}>()

const router = useRouter()
const workspaceStore = useWorkspaceStore()
const foldersStore = useFoldersStore()

const menuOpenFolderId = ref<string | null>(null)

const recentFolders = computed(() => {
  const workspaceId = workspaceStore.activeWorkspace?.id
  if (!workspaceId) return []

  return [...foldersStore.folders]
    .filter((f) => f.workspaceId === workspaceId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4)
})

function openFolderNotes(folderId: string) {
  router.push({
    name: 'DashboardFolderNotes',
    params: { folderId },
  })
}

function isMenuOpen(folderId: string) {
  return menuOpenFolderId.value === folderId
}

function setMenuOpen(folderId: string, open: boolean) {
  menuOpenFolderId.value = open ? folderId : null
}
</script>

<template>
  <h2 class="mb-5 text-[20px] font-medium tracking-[-0.011em] text-white">
    Recent folders
  </h2>

  <div v-if="recentFolders.length === 0" class="pb-6 text-sm text-white/45">
    No folders in this workspace yet.
  </div>
  <div v-else class="grid grid-cols-4 gap-[34px] pb-10">
    <div
      v-for="folder in recentFolders"
      :key="folder.id"
      role="button"
      tabindex="0"
      class="folder-card"
      @click="openFolderNotes(folder.id)"
      @keydown.enter="openFolderNotes(folder.id)"
    >
      <img
        :src="bigFolder"
        :alt="folder.name"
        class="absolute inset-0 h-full w-full"
      />
      <div class="absolute inset-0 flex items-start justify-between">
        <div class="ml-[12px] mt-[31px]">
          <h3 class="text-sm font-medium text-white">{{ folder.name }}</h3>
          <p class="mt-[0.94px] text-[11px] text-white/40">
            {{ folder.noteCount }} files
          </p>
        </div>
        <FolderCardContextMenu
          :model-value="isMenuOpen(folder.id)"
          @update:model-value="setMenuOpen(folder.id, $event)"
          @edit="emit('edit', folder)"
          @delete="emit('delete', folder)"
        />
      </div>
    </div>
  </div>
</template>
