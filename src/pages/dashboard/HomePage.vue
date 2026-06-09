<script setup lang="ts">
import { ref } from 'vue'
import DashboardBottomFade from '@/components/dashboard/DashboardBottomFade.vue'
import EditFolderPopup from '@/components/dashboard/EditFolderPopup.vue'
import DeleteFolderPopup from '@/components/dashboard/DeleteFolderPopup.vue'
import HomeTimetableSection from '@/components/dashboard/home/HomeTimetableSection.vue'
import HomeRecentFolders from '@/components/dashboard/home/HomeRecentFolders.vue'
import HomeUpcomingDeadlines from '@/components/dashboard/home/HomeUpcomingDeadlines.vue'
import { useUpcomingDeadlines } from '@/composables/useUpcomingDeadlines'
import type { Folder } from '@/stores/folders'

const { rows, isLoading, error } = useUpcomingDeadlines()

const folderToEdit = ref<Folder | null>(null)
const folderToDelete = ref<Folder | null>(null)
const showEditPopup = ref(false)
const showDeletePopup = ref(false)

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
    <div
      class="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <HomeTimetableSection />
      <HomeRecentFolders @edit="handleEdit" @delete="handleDelete" />
      <HomeUpcomingDeadlines :rows="rows" :loading="isLoading" :error="error" />
    </div>

    <DashboardBottomFade variant="todoList" />

    <EditFolderPopup v-model="showEditPopup" :folder="folderToEdit" />
    <DeleteFolderPopup v-model="showDeletePopup" :folder="folderToDelete" />
  </section>
</template>
