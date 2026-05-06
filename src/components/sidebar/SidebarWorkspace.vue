<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useFoldersStore } from '@/stores/folders'
import { useTodoListsStore } from '@/stores/todoLists'
import folderIcon from '@/assets/img/folder.svg'
import todoIcon from '@/assets/img/todo.svg'
import selectorIcon from '@/assets/img/selector.svg'

type WorkspaceTab = 'folders' | 'todo'

const props = defineProps({
  active: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:active'])
const foldersStore = useFoldersStore()
const todoListsStore = useTodoListsStore()

const sectionItems = [
  { id: 'folders' as const, label: 'Folders', icon: folderIcon },
  { id: 'todo' as const, label: 'To do', icon: todoIcon },
]

const folderSubItems = computed(() =>
  foldersStore.folders.map((folder) => ({
    id: folder.id,
    label: folder.name
  }))
)

const todoSubItems = computed(() =>
  todoListsStore.todoLists.map((todoList) => ({
    id: todoList.id,
    label: todoList.name
  }))
)

const expandedSections = reactive<Record<WorkspaceTab, boolean>>({
  folders: false,
  todo: false
})

const setActive = (id: WorkspaceTab) => {
  emit('update:active', id)
}

const toggleExpanded = (id: WorkspaceTab) => {
  expandedSections[id] = !expandedSections[id]
}
</script>

<template>
  <p class="section-label">Your workspace</p>

  <div
    v-for="item in sectionItems"
    :key="item.id"
    class="workspace-section"
  >
    <div
      class="nav-link workspace"
      :class="{ active: props.active === item.id }"
    >
      <button type="button" class="workspace-main" @click="setActive(item.id)">
        <img :src="item.icon" :alt="item.label" class="icon" />
        <span>{{ item.label }}</span>
      </button>
      <button
        type="button"
        class="selector-button"
        :aria-label="`Toggle ${item.label} list`"
        @click.stop="toggleExpanded(item.id)"
      >
        <img
          :src="selectorIcon"
          class="selector"
          :class="{ open: expandedSections[item.id] }"
          :alt="`${item.label} selector`"
        />
      </button>
    </div>

    <template v-if="item.id === 'folders' && expandedSections.folders">
      <div class="subtasks">
        <div v-if="foldersStore.isLoading" class="nav-link substate">Loading folders...</div>
        <div v-else-if="folderSubItems.length === 0" class="nav-link substate">No folders</div>
        <div v-for="folder in folderSubItems" v-else :key="folder.id" class="nav-link">
          <img :src="folderIcon" alt="folder item" class="icon small" />
          <span>{{ folder.label }}</span>
        </div>
      </div>
    </template>

    <template v-else-if="item.id === 'todo' && expandedSections.todo">
      <div class="subtasks">
        <div v-if="todoListsStore.isLoading" class="nav-link substate">Loading todo lists...</div>
        <div v-else-if="todoSubItems.length === 0" class="nav-link substate">No todo lists</div>
        <div v-for="todo in todoSubItems" v-else :key="todo.id" class="nav-link">
          <img :src="todoIcon" alt="todo item" class="icon small" />
          <span>{{ todo.label }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.section-label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.3);
  margin: 24px 0 8px;
  padding: 0 12px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s, background 0.2s;
}

.nav-link:hover,
.nav-link.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.nav-link.workspace {
  justify-content: space-between;
  padding: 0;
}

.workspace-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.selector-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  margin-right: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.subtasks {
  margin-left: 20px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 4px;
}

.substate {
  color: rgba(255, 255, 255, 0.45);
}

.workspace-section + .workspace-section {
  margin-top: 2px;
}

.icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.icon.small {
  transform: scale(0.9);
}

.nav-link:hover .icon,
.nav-link.active .icon {
  opacity: 1;
}

.selector {
  width: 16px;
  height: 16px;
  opacity: 0.5;
  transform: rotate(0deg);
  transition: transform 0.3s, opacity 0.2s;
}

.selector.open {
  transform: rotate(180deg);
}

.nav-link.workspace:hover .selector,
.nav-link.workspace.active .selector {
  opacity: 1;
}
</style>
