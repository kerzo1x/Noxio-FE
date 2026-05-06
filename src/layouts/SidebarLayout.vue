<script setup>
import { ref } from 'vue'
import SidebarNav from '@/components/sidebar/SidebarNav.vue'
import SidebarWorkspace from '@/components/sidebar/SidebarWorkspace.vue'
import SidebarPicker from '@/components/sidebar/SidebarPicker.vue'
import { useWorkspaceStore } from '@/stores/workspace'

const workspaceStore = useWorkspaceStore()
const active = ref('')
</script>

<template>
  <aside class="sidebar">
    <nav class="grow sidebar-content">
      <SidebarNav />
      <SidebarWorkspace
        v-if="workspaceStore.workspaces.length > 0"
        v-model:active="active"
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
  height: 100dvh;
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