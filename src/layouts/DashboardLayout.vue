<script setup lang="ts">
import { onMounted, provide, ref, watch } from 'vue'
import { useDashboardContentAlign } from '@/composables/useDashboardContentAlign'
import { dashboardLayoutMetricsKey } from '@/composables/useDashboardContentAlign' // TODO: preco importujes dve veci z toho isteho suboru oddelene??
import { useUserStore } from '@/stores/user'
import { useWorkspaceStore } from '@/stores/workspace'
import { useNotificationsStore } from '@/stores/notifications'
import { storeToRefs } from 'pinia'
import banner from '@/assets/img/banner.svg'
import HeaderComponent from '@/components/dashboard/HeaderComponent.vue'
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
    if (workspaceId !== previousWorkspaceId) { // TODO: toto je vzdy true v watch callbacku, lebo watch sa zavola iba ked sa zmeni hodnota ...
      await workspaceStore.loadWorkspaceContext(workspaceId, {
        force: workspaceId != null && previousWorkspaceId != null,
      })
      return
    }
     await workspaceStore.loadWorkspaceContext(workspaceId) // TODO: toto sa nikdy nevykona, malo by to volat --> loadWorkspaceContext(workspaceId, { force: true })
  },
  { immediate: true },
)

onMounted(async () => { // TODO: toto je doslova fire and forget ... treba pridat await Promise.all() alebo nieco podobne
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
    <div class="flex-none h-[157px] w-full overflow-hidden" aria-hidden="true">
      <img
        :src="banner"
        alt=""
        class="h-full w-full object-cover object-center"
      />
    </div>
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
