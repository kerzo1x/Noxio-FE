<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SidebarWorkspaceTabs, {
  type WorkspaceTab,
} from '@/components/sidebar/SidebarWorkspaceTabs.vue'
import { useFoldersStore } from '@/stores/folders'
import { useTodoListsStore } from '@/stores/todoLists'
import folderIcon from '@/assets/img/folder.svg'
import todoIcon from '@/assets/img/todo.svg'

defineProps({
  active: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{
  'update:active': [tab: WorkspaceTab]
}>()

const route = useRoute()
const router = useRouter()
const foldersStore = useFoldersStore()
const todoListsStore = useTodoListsStore()

const activeFolderId = computed(() => {
  if (route.name !== 'DashboardFolderNotes') return null
  const folderId = route.params.folderId
  return typeof folderId === 'string' ? folderId : null
})

const activeTodoListId = computed(() => {
  if (route.name !== 'DashboardTodoList') return null
  const todoListId = route.params.todoListId
  return typeof todoListId === 'string' ? todoListId : null
})

const sectionItems = [
  { id: 'folders' as const, label: 'Folders', icon: folderIcon },
  { id: 'todo' as const, label: 'To do', icon: todoIcon },
]

const sectionData = computed(() => ({
  folders: {
    items: foldersStore.folders.map((f) => ({ id: f.id, label: f.name })),
    isLoading: foldersStore.isLoading,
    error: foldersStore.error,
    icon: folderIcon,
    emptyLabel: 'No folders',
  },
  todo: {
    items: todoListsStore.todoLists.map((t) => ({ id: t.id, label: t.name })),
    isLoading: todoListsStore.isLoading,
    error: todoListsStore.error,
    icon: todoIcon,
    emptyLabel: 'No todo lists',
  },
}))

const expandedSectionsStorageKey = 'sidebar-workspace-expanded-sections'

function readExpandedSections(): Record<WorkspaceTab, boolean> {
  if (typeof window === 'undefined') {
    return { folders: false, todo: false }
  }

  const raw = window.localStorage.getItem(expandedSectionsStorageKey)
  if (!raw) {
    return { folders: false, todo: false }
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Record<WorkspaceTab, boolean>>
    return {
      folders: parsed.folders === true,
      todo: parsed.todo === true,
    }
  } catch {
    return { folders: false, todo: false }
  }
}

const expandedSections = reactive<Record<WorkspaceTab, boolean>>(readExpandedSections())

watch(
  expandedSections,
  (value) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(expandedSectionsStorageKey, JSON.stringify(value))
  },
  { deep: true },
)

watch(
  activeFolderId,
  (folderId) => {
    if (folderId) expandedSections.folders = true
  },
  { immediate: true },
)

function setActive(id: WorkspaceTab) {
  emit('update:active', id)
}

function toggleExpanded(id: WorkspaceTab) {
  expandedSections[id] = !expandedSections[id]
}

function openFolderNotes(folderId: string) {
  router.push({ name: 'DashboardFolderNotes', params: { folderId } })
}

function openTodoList(todoListId: string) {
  router.push({ name: 'DashboardTodoList', params: { todoListId } })
}
</script>

<template>
  <!-- flex-1 + min-h-0 from layout: row gets a bounded height so overflow-y-auto works -->
  <div
    class="mt-6 flex min-h-0 max-h-[350px] w-full flex-1 flex-col overflow-hidden"
  >
    <p class="shrink-0 px-3 mb-2 text-sm font-medium text-white/50">Your workspace</p>

    <div class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div
        class="workspace-scroll-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
      >
        <SidebarWorkspaceTabs
          :items="sectionItems"
          :active="active"
          :expanded-sections="expandedSections"
          :section-data="sectionData"
          :active-folder-id="activeFolderId"
          :active-todo-list-id="activeTodoListId"
          @activate="setActive"
          @toggle="toggleExpanded"
          @open-folder="openFolderNotes"
          @open-todo-list="openTodoList"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.workspace-scroll-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.workspace-scroll-hide::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
</style>
