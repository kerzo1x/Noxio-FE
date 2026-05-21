<script setup lang="ts">
import { computed } from 'vue'
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
  DashboardFolderNotes: 'folders',
  DashboardTodo: 'todo',
  DashboardTodoList: 'todo',
}

const workspaceStore = useWorkspaceStore()
const route = useRoute()
const router = useRouter()

/** Only highlight Folders / To do when that route is active — not on Home or other dashboard pages. */
const activeWorkspaceTab = computed(() => {
  const name = route.name as string | undefined
  if (!name) return ''
  return routeToTab[name] ?? ''
})

function handleWorkspaceTabChange(tab: WorkspaceTab) {
  router.push({ name: tabRouteMap[tab] })
}
</script>

<template>
  <aside class="flex h-full min-h-0 w-[283px] shrink-0 flex-col bg-black">
    <nav class="min-h-0 grow flex flex-col ml-[56px] mt-[51px] text-sm mr-[81px]">
      <SidebarNav />
      <SidebarWorkspace
        v-if="workspaceStore.workspaces.length > 0"
        class="min-h-0 min-w-0 flex-1 overflow-hidden"
        :active="activeWorkspaceTab"
        @update:active="handleWorkspaceTabChange"
      />
    </nav>
    <SidebarPicker class="w-[203px] ml-[61px] mb-[49px]"/>
  </aside>
</template>
