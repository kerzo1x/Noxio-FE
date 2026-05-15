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
  async (workspaceId) => {
    await syncWorkspaceScopedData(workspaceId)
  }
)

onMounted(async () => {
  userStore.fetchUser()
  await workspaceStore.fetchWorkspaces()
  const workspaceId = workspaceStore.activeWorkspace?.id ?? null
  await syncWorkspaceScopedData(workspaceId)
})
</script>

<template>
  <div class="flex flex-col h-dvh overflow-hidden bg-black">
    <HeaderComponent class="flex-none" />
    <BannerComponent class="flex-none" />
    <div class="flex flex-1 min-h-0">
      <SidebarLayout class="flex-none" />
      <main class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          class="ml-[5.83vw] mt-[25px] mr-[8.96vw] mb-[2px] flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div
            class="flex min-h-0 flex-1 justify-center overflow-y-auto overflow-x-hidden"
          >
            <router-view />
          </div>
        </div>
      </main>
    </div>

    <WorkspacePopup />
  </div>
</template>
