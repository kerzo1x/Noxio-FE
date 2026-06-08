<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFoldersStore } from '@/stores/folders'
import { useTodoListsStore } from '@/stores/todoLists'
import folderIcon from '@/assets/img/folder.svg'
import todoIcon from '@/assets/img/todo.svg'
import selectorIcon from '@/assets/img/selector.svg'

type WorkspaceTab = 'folders' | 'todo'

interface SubItem {
  id: string
  label: string
}

interface SectionMeta {
  items: SubItem[]
  isLoading: boolean
  error: string | null
  icon: string
  emptyLabel: string
}

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

const sectionData = computed<Record<WorkspaceTab, SectionMeta>>(() => ({
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

const setActive = (id: WorkspaceTab) => {
  emit('update:active', id)
}

const toggleExpanded = (id: WorkspaceTab) => {
  expandedSections[id] = !expandedSections[id]
}

function openFolderNotes(folderId: string) {
  router.push({
    name: 'DashboardFolderNotes',
    params: { folderId },
  })
}

function openTodoList(todoListId: string) {
  router.push({
    name: 'DashboardTodoList',
    params: { todoListId },
  })
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
        <div class="space-y-0.5">
          <div v-for="item in sectionItems" :key="item.id">
            <div
              class="sidebar-link group min-w-0 justify-between"
              :class="{ active: active === item.id }"
            >
              <button
                type="button"
                class="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-3 py-2 text-left"
                @click="setActive(item.id)"
              >
                <img :src="item.icon" :alt="item.label" class="sidebar-icon" />
                <span class="whitespace-nowrap">{{ item.label }}</span>
              </button>
              <button
                type="button"
                class="mr-1.5 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center"
                :aria-label="`Toggle ${item.label} list`"
                @click.stop="toggleExpanded(item.id)"
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

            <div
              v-if="expandedSections[item.id]"
              class="ml-5 mt-1 border-l border-white/10"
            >
              <div
                v-if="sectionData[item.id].isLoading"
                class="flex items-center gap-3 px-3 py-2 text-sm text-white/45"
              >
                Loading...
              </div>
              <div
                v-else-if="sectionData[item.id].error"
                class="flex items-center gap-3 px-3 py-2 text-sm text-red-400/70"
              >
                {{ sectionData[item.id].error }}
              </div>
              <div
                v-else-if="sectionData[item.id].items.length === 0"
                class="flex items-center gap-3 px-3 py-2 text-sm text-white/45"
              >
                {{ sectionData[item.id].emptyLabel }}
              </div>
              <template v-else>
                <button
                  v-for="sub in sectionData[item.id].items"
                  :key="sub.id"
                  type="button"
                  class="sidebar-link w-full px-3 py-2 text-left"
                  :class="{
                    active:
                      (item.id === 'folders' && activeFolderId === sub.id) ||
                      (item.id === 'todo' && activeTodoListId === sub.id),
                  }"
                  @click="
                    item.id === 'folders'
                      ? openFolderNotes(sub.id)
                      : openTodoList(sub.id)
                  "
                >
                  <img
                    :src="sectionData[item.id].icon"
                    alt=""
                    class="sidebar-icon scale-90"
                  />
                  <span>{{ sub.label }}</span>
                </button>
              </template>
            </div>
          </div>
        </div>
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
