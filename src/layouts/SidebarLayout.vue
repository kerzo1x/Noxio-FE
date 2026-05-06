<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SidebarNav from '@/components/sidebar/SidebarNav.vue'
import SidebarWorkspace from '@/components/sidebar/SidebarWorkspace.vue'
import SidebarPicker from '@/components/sidebar/SidebarPicker.vue'
import { useWorkspaceStore } from '@/stores/workspace'

type WorkspaceTab = 'folders' | 'todo'

const tabRouteMap: Record<WorkspaceTab, string> = {
  folders: 'DashboardFolders',
  todo: 'DashboardTodo',
}

const routeToTab: Partial<Record<string, WorkspaceTab>> = {
  DashboardFolders: 'folders',
  DashboardTodo: 'todo',
}

const workspaceStore = useWorkspaceStore()
const route = useRoute()
const router = useRouter()
const lastActiveWorkspaceTab = ref<WorkspaceTab>('folders')

watch(
  () => route.name as string | undefined,
  (routeName) => {
    const mappedTab = routeName ? routeToTab[routeName] : undefined
    if (mappedTab) {
      lastActiveWorkspaceTab.value = mappedTab
    }
  },
  { immediate: true }
)

const activeWorkspaceTab = computed(() => {
  const mappedTab = routeToTab[route.name as string]
  return mappedTab ?? lastActiveWorkspaceTab.value
})

function handleWorkspaceTabChange(tab: WorkspaceTab) {
  router.push({ name: tabRouteMap[tab] })
}
</script>

<template>
  <aside class="w-[283px] shrink-0 h-full bg-black flex flex-col">
    <nav class="grow flex flex-col ml-[56px] mt-[51px] text-sm mr-[81px]">
      <SidebarNav />
      <SidebarWorkspace
        v-if="workspaceStore.workspaces.length > 0"
        :active="activeWorkspaceTab"
        @update:active="handleWorkspaceTabChange"
      />
    </nav>
    <SidebarPicker class="w-[203px] ml-[61px] mb-[49px]"/>
  </aside>
</template>
