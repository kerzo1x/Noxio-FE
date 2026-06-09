<script setup lang="ts">
import selectorIcon from '@/assets/img/selector.svg'
import SidebarWorkspaceList, {
  type WorkspaceSectionMeta,
  type WorkspaceTab,
} from '@/components/sidebar/SidebarWorkspaceList.vue'

export type { WorkspaceTab }

export interface WorkspaceTabItem {
  id: WorkspaceTab
  label: string
  icon: string
}

defineProps<{
  items: WorkspaceTabItem[]
  active: string
  expandedSections: Record<WorkspaceTab, boolean>
  sectionData: Record<WorkspaceTab, WorkspaceSectionMeta>
  activeFolderId: string | null
  activeTodoListId: string | null
}>()

const emit = defineEmits<{
  activate: [tab: WorkspaceTab]
  toggle: [tab: WorkspaceTab]
  openFolder: [folderId: string]
  openTodoList: [todoListId: string]
}>()
</script>

<template>
  <div class="space-y-0.5">
    <div v-for="item in items" :key="item.id">
      <div
        class="sidebar-link group min-w-0 justify-between"
        :class="{ active: active === item.id }"
      >
        <button
          type="button"
          class="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-3 py-2 text-left"
          @click="emit('activate', item.id)"
        >
          <img :src="item.icon" :alt="item.label" class="sidebar-icon" />
          <span class="whitespace-nowrap">{{ item.label }}</span>
        </button>
        <button
          type="button"
          class="mr-1.5 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center"
          :aria-label="`Toggle ${item.label} list`"
          @click.stop="emit('toggle', item.id)"
        >
          <img
            :src="selectorIcon"
            class="h-4 w-4 transition-all duration-300 group-hover:opacity-100"
            :class="[
              expandedSections[item.id] ? 'rotate-180' : '',
              active === item.id ? 'opacity-100' : 'opacity-50',
            ]"
            :alt="`${item.label} selector`"
          />
        </button>
      </div>

      <SidebarWorkspaceList
        v-if="expandedSections[item.id]"
        :section-id="item.id"
        :meta="sectionData[item.id]"
        :active-folder-id="activeFolderId"
        :active-todo-list-id="activeTodoListId"
        @open-folder="emit('openFolder', $event)"
        @open-todo-list="emit('openTodoList', $event)"
      />
    </div>
  </div>
</template>
