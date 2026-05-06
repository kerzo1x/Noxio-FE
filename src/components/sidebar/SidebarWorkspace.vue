<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
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

const foldersStore = useFoldersStore()
const todoListsStore = useTodoListsStore()

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
  { deep: true }
)

const setActive = (id: WorkspaceTab) => {
  emit('update:active', id)
}

const toggleExpanded = (id: WorkspaceTab) => {
  expandedSections[id] = !expandedSections[id]
}
</script>

<template>
  <p class="text-sm font-medium text-white/30 mt-6 mb-2 px-3">Your workspace</p>

  <div class="space-y-0.5">
    <div v-for="item in sectionItems" :key="item.id">
      <div
        class="sidebar-link group justify-between"
        :class="{ active: active === item.id }"
      >
        <button
          type="button"
          class="flex items-center gap-3 flex-1 px-3 py-2 text-left cursor-pointer"
          @click="setActive(item.id)"
        >
          <img :src="item.icon" :alt="item.label" class="sidebar-icon" />
          <span>{{ item.label }}</span>
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center w-8 mr-1.5 cursor-pointer"
          :aria-label="`Toggle ${item.label} list`"
          @click.stop="toggleExpanded(item.id)"
        >
          <img
            :src="selectorIcon"
            class="w-4 h-4 transition-all duration-300 group-hover:opacity-100"
            :class="[
              expandedSections[item.id] ? 'rotate-180' : '',
              active === item.id ? 'opacity-100' : 'opacity-50'
            ]"
            :alt="`${item.label} selector`"
          />
        </button>
      </div>

      <div v-if="expandedSections[item.id]" class="ml-5 border-l border-white/10 mt-1">
        <div v-if="sectionData[item.id].isLoading" class="flex items-center gap-3 px-3 py-2 text-sm text-white/45">
          Loading...
        </div>
        <div v-else-if="sectionData[item.id].error" class="flex items-center gap-3 px-3 py-2 text-sm text-red-400/70">
          {{ sectionData[item.id].error }}
        </div>
        <div v-else-if="sectionData[item.id].items.length === 0" class="flex items-center gap-3 px-3 py-2 text-sm text-white/45">
          {{ sectionData[item.id].emptyLabel }}
        </div>
        <template v-else>
          <div v-for="sub in sectionData[item.id].items" :key="sub.id" class="sidebar-link px-3 py-2">
            <img :src="sectionData[item.id].icon" alt="" class="sidebar-icon scale-90" />
            <span>{{ sub.label }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
