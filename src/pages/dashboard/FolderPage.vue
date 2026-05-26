<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFoldersStore, type Folder } from '@/stores/folders'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import AddFolderPopup from '@/components/dashboard/AddFolderPopup.vue'
import EditFolderPopup from '@/components/dashboard/EditFolderPopup.vue'
import DeleteFolderPopup from '@/components/dashboard/DeleteFolderPopup.vue'
import FolderCardContextMenu from '@/components/dashboard/FolderCardContextMenu.vue'
import bigFolder from '@/assets/img/big-folder.svg'

const router = useRouter()
const foldersStore = useFoldersStore()
const showAddFolderPopup = ref(false)
const menuOpenFolderId = ref<string | null>(null)
const folderToEdit = ref<Folder | null>(null)
const folderToDelete = ref<Folder | null>(null)
const showEditPopup = ref(false)
const showDeletePopup = ref(false)

const handleAddFolder = () => {
  showAddFolderPopup.value = true
}

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
    <header
      class="sticky mb-5 top-0 z-10 shrink-0 -mx-1 bg-black px-1 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.45)]"
    >
      <div class="flex items-center justify-between">
        <h1 class="text-[20px] font-medium tracking-[-0.011em] text-white">
          Folders
        </h1>
        <div class="h-[29px] w-[203px]">
          <BaseButton
            text="Add folder"
            class="!h-[29px] !rounded-[10px] !px-[10px] !py-0 !font-medium !text-[12px] !leading-[150%]"
            @click="handleAddFolder"
          />
        </div>
      </div>
    </header>

    <div
      class="relative pt-[74px] min-h-0 flex-1 overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div class="grid grid-cols-4 gap-[34px]">
        <div
          v-for="folder in foldersStore.folders"
          :key="folder.id"
          role="button"
          tabindex="0"
          class="relative aspect-[186/146] h-[146px] w-[186px] cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
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
              @edit="handleEdit(folder)"
              @delete="handleDelete(folder)"
            />
          </div>
        </div>
      </div>
    </div>

    <div
      class="pointer-events-none sticky bottom-0 z-[1px] h-[2px] w-full bg-black shadow-[0_-3px_10px_-1px_rgba(0,0,0,0.35)]"
      aria-hidden="true"
    />

    <AddFolderPopup v-model="showAddFolderPopup" />
    <EditFolderPopup v-model="showEditPopup" :folder="folderToEdit" />
    <DeleteFolderPopup v-model="showDeletePopup" :folder="folderToDelete" />
  </section>
</template>
