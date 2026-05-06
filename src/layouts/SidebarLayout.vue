<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SidebarNav from '@/components/sidebar/SidebarNav.vue'
import SidebarWorkspace from '@/components/sidebar/SidebarWorkspace.vue'
import SidebarPicker from '@/components/sidebar/SidebarPicker.vue'
import { useWorkspaceStore } from '@/stores/workspace'

const workspaceStore = useWorkspaceStore()
const route = useRoute()
const router = useRouter()

const activeWorkspaceTab = computed(() => {
  if (route.name === 'DashboardFolders') return 'folders'
  if (route.name === 'DashboardTodo') return 'todo'
  return ''
})

function handleWorkspaceTabChange(tab: string) {
  if (tab === 'folders') {
    router.push({ name: 'DashboardFolders' })
    return
  }
  if (tab === 'todo') {
    router.push({ name: 'DashboardTodo' })
  }
}
</script>

<template>
  <aside class="sidebar">
    <nav class="grow sidebar-content">
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

<style scoped>
.sidebar {
  width: 283px;
  min-width: 283px;
  max-width: 283px;
  height: 100%;
  background: #000;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  margin-left: 56px;
  margin-top: 51px;
  font-size: 14px;
  margin-right: 81px;
}

</style>