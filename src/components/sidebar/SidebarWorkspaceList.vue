<script setup lang="ts">
export type WorkspaceTab = 'folders' | 'todo'

export interface WorkspaceListItem {
  id: string
  label: string
}

export interface WorkspaceSectionMeta {
  items: WorkspaceListItem[]
  isLoading: boolean
  error: string | null
  icon: string
  emptyLabel: string
}

defineProps<{
  sectionId: WorkspaceTab
  meta: WorkspaceSectionMeta
  activeFolderId: string | null
  activeTodoListId: string | null
}>()

const emit = defineEmits<{
  openFolder: [folderId: string]
  openTodoList: [todoListId: string]
}>()
</script>

<template>
  <div class="ml-5 mt-1 border-l border-white/10">
    <div
      v-if="meta.isLoading"
      class="flex items-center gap-3 px-3 py-2 text-sm text-white/45"
    >
      Loading...
    </div>
    <div
      v-else-if="meta.error"
      class="flex items-center gap-3 px-3 py-2 text-sm text-red-400/70"
    >
      {{ meta.error }}
    </div>
    <div
      v-else-if="meta.items.length === 0"
      class="flex items-center gap-3 px-3 py-2 text-sm text-white/45"
    >
      {{ meta.emptyLabel }}
    </div>
    <template v-else>
      <button
        v-for="sub in meta.items"
        :key="sub.id"
        type="button"
        class="sidebar-link w-full px-3 py-2 text-left"
        :class="{
          active:
            (sectionId === 'folders' && activeFolderId === sub.id) ||
            (sectionId === 'todo' && activeTodoListId === sub.id),
        }"
        @click="
          sectionId === 'folders'
            ? emit('openFolder', sub.id)
            : emit('openTodoList', sub.id)
        "
      >
        <img :src="meta.icon" alt="" class="sidebar-icon scale-90" />
        <span>{{ sub.label }}</span>
      </button>
    </template>
  </div>
</template>
