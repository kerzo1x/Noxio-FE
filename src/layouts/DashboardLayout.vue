<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { useWorkspaceStore } from '@/stores/workspace'
import { useNotificationsStore } from '@/stores/notifications'
import { storeToRefs } from 'pinia'
import HeaderComponent from '@/components/dashboard/HeaderComponent.vue'
import BannerComponent from '@/components/dashboard/BannerComponent.vue'
import SidebarLayout from './SidebarLayout.vue'
import WorkspacePopup from '@/components/dashboard/WorkspacePopup.vue'

const userStore = useUserStore()
const workspaceStore = useWorkspaceStore()
const notificationsStore = useNotificationsStore()

const { hasNotifications, items: notifications, isLoading: isNotificationsLoading } =
  storeToRefs(notificationsStore)

watch(
  () => workspaceStore.activeWorkspace?.id ?? null,
  async (workspaceId, previousWorkspaceId) => {
    if (workspaceId !== previousWorkspaceId) {
      await workspaceStore.loadWorkspaceContext(workspaceId, {
        force: workspaceId != null && previousWorkspaceId != null,
      })
      return
    }
    await workspaceStore.loadWorkspaceContext(workspaceId)
  },
  { immediate: true },
)

onMounted(async () => {
  userStore.fetchUser()
  await workspaceStore.fetchWorkspaces()
})

function refreshNotifications() {
  const workspaceId = workspaceStore.activeWorkspace?.id ?? null
  void notificationsStore.fetchNotifications(workspaceId, { force: true })
}
</script>

<template>
  <div class="flex flex-col h-dvh overflow-hidden bg-black">
    <HeaderComponent
      class="flex-none"
      :has-notifications="hasNotifications"
      :notifications="notifications"
      :is-notifications-loading="isNotificationsLoading"
      @refresh-notifications="refreshNotifications"
    />
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
