<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFoldersStore, type Folder } from '@/stores/folders'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader.vue'
import DashboardFolderCard from '@/components/dashboard/DashboardFolderCard.vue'
import AddFolderPopup from '@/components/dashboard/AddFolderPopup.vue'
import EditFolderPopup from '@/components/dashboard/EditFolderPopup.vue'
import DeleteFolderPopup from '@/components/dashboard/DeleteFolderPopup.vue'
import DashboardBottomFade from '@/components/dashboard/DashboardBottomFade.vue'
import bigFolder from '@/assets/img/big-folder.svg'

const router = useRouter()
const foldersStore = useFoldersStore()
const showAddFolderPopup = ref(false)
const menuOpenFolderId = ref<string | null>(null)
const folderToEdit = ref<Folder | null>(null)
const folderToDelete = ref<Folder | null>(null)
const showEditPopup = ref(false)
const showDeletePopup = ref(false)

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

function handleEdit(folder: Folder) {
  folderToEdit.value = folder
  showEditPopup.value = true
}

function handleDelete(folder: Folder) {
  folderToDelete.value = folder
  showDeletePopup.value = true
}
</script>

<template>
  <section class="dashboard-page-column">
    <DashboardPageHeader title="Folders">
      <template #action>
        <BaseButton
          text="Add folder"
          class="!h-full !w-full !rounded-card !px-2.5 !py-0 !font-medium !text-xs !leading-normal"
          @click="showAddFolderPopup = true"
        />
      </template>
    </DashboardPageHeader>

    <div
      class="relative pt-[74px] min-h-0 flex-1 overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div class="grid grid-cols-4 grid-folders">
        <DashboardFolderCard
          v-for="folder in foldersStore.folders"
          :key="folder.id"
          variant="folder"
          :title="folder.name"
          :subtitle="`${folder.noteCount} files`"
          :image-src="bigFolder"
          :image-alt="folder.name"
          :menu-open="isMenuOpen(folder.id)"
          @open="openFolderNotes(folder.id)"
          @update:menu-open="setMenuOpen(folder.id, $event)"
          @edit="handleEdit(folder)"
          @delete="handleDelete(folder)"
        />
      </div>
    </div>

    <DashboardBottomFade />

    <AddFolderPopup v-model="showAddFolderPopup" />
    <EditFolderPopup v-model="showEditPopup" :folder="folderToEdit" />
    <DeleteFolderPopup v-model="showDeletePopup" :folder="folderToDelete" />
  </section>
</template>
