<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { useWorkspaceStore } from '@/stores/workspace'
import { useFoldersStore } from '@/stores/folders'
import { useTodoListsStore } from '@/stores/todoLists'
import HeaderComponent from '@/components/dashboard/HeaderComponent.vue'
import BannerComponent from '@/components/dashboard/BannerComponent.vue'
import SidebarLayout from './SidebarLayout.vue'
import WorkspacePopup from '@/components/dashboard/WorkspacePopup.vue'

const userStore = useUserStore()
const workspaceStore = useWorkspaceStore()
const foldersStore = useFoldersStore()
const todoListsStore = useTodoListsStore()

async function syncWorkspaceScopedData(workspaceId: string | null) {
  if (!workspaceId) {
    foldersStore.reset()
    todoListsStore.reset()
    return
  }

  await Promise.all([
    foldersStore.loadedWorkspaceId !== workspaceId && !foldersStore.isLoading
      ? foldersStore.fetchFolders(workspaceId)
      : Promise.resolve(),
    todoListsStore.loadedWorkspaceId !== workspaceId && !todoListsStore.isLoading
      ? todoListsStore.fetchTodoLists(workspaceId)
      : Promise.resolve()
  ])
}

watch(
  () => workspaceStore.activeWorkspace?.id ?? null,
  (workspaceId) => syncWorkspaceScopedData(workspaceId)
)

onMounted(async () => {
  userStore.fetchUser()
  await workspaceStore.fetchWorkspaces()
  await syncWorkspaceScopedData(workspaceStore.activeWorkspace?.id ?? null)
})
</script>

<template>
  <div class="flex flex-col h-dvh overflow-hidden bg-black">
    <HeaderComponent class="flex-none" />
    <BannerComponent class="flex-none" />
    <div class="flex flex-1 min-h-0">
      <SidebarLayout class="flex-none" />
      <main class="flex-1 min-h-0 overflow-auto">
        <div class="ml-[5.83vw] mt-[25px] mr-[8.96vw] flex justify-center">
          <router-view />
        </div>
      </main>
    </div>

    <WorkspacePopup />
  </div>
</template>
