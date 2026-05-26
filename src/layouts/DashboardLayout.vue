<script setup lang="ts">
import { onMounted, provide, ref, watch } from 'vue'
import { useDashboardContentAlign } from '@/composables/useDashboardContentAlign'
import { dashboardLayoutMetricsKey } from '@/composables/dashboardLayoutMetrics'
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

const contentRailRef = ref<HTMLElement | null>(null)
const { contentAlignLeft } = useDashboardContentAlign(contentRailRef)

provide(dashboardLayoutMetricsKey, { contentAlignLeft })
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
          class="dashboard-content-inset dashboard-content-inset--stack mt-[25px] mb-[2px] overflow-hidden"
        >
          <div
            ref="contentRailRef"
            class="dashboard-content-rail overflow-y-auto"
          >
            <router-view />
          </div>
        </div>
      </main>
    </div>

    <WorkspacePopup />
  </div>
</template>
