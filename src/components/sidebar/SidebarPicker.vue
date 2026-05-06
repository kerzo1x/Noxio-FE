<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace'
import selectorIcon from '@/assets/img/selector.svg'
import addIcon from '@/assets/img/add.svg'

const workspaceStore = useWorkspaceStore()

const rootRef = ref(null)
const dropdownOpen = ref(false)

const toggleDropdown = (e) => {
  e.stopPropagation()
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const openCreateWorkspaceModal = () => {
  closeDropdown()
  workspaceStore.openCreateWorkspacePopup()
}

const onDocumentClick = (e) => {
  if (!rootRef.value) return
  if (rootRef.value.contains(e.target)) return
  if (dropdownOpen.value) closeDropdown()
}

const onDocumentKeydown = (e) => {
  if (e.key === 'Escape' && dropdownOpen.value) closeDropdown()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onDocumentKeydown)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onDocumentKeydown)
})

const handlePickWorkspace = (workspace) => {
  workspaceStore.selectWorkspace(workspace)
  closeDropdown()
}
</script>

<template>
  <div ref="rootRef" class="picker-root">
    <div
      v-if="workspaceStore.isLoading && workspaceStore.workspaces.length === 0"
      class="loading-placeholder"
    >
      Checking workspaces...
    </div>

    <template v-else-if="workspaceStore.workspaces.length > 0">
      <div
        class="workspace-switcher"
        role="button"
        tabindex="0"
        :aria-expanded="dropdownOpen"
        aria-haspopup="listbox"
        @click="toggleDropdown"
        @keydown.enter.prevent="toggleDropdown"
        @keydown.space.prevent="toggleDropdown"
      >
        <div class="avatar">
          {{ workspaceStore.activeWorkspace?.name?.charAt(0) || '?' }}
        </div>
        <span class="truncate">
          {{ workspaceStore.activeWorkspace?.name || 'Loading...' }}
        </span>
        <img
          :src="selectorIcon"
          alt=""
          class="icon"
          :class="{ 'icon--open': dropdownOpen }"
        />
      </div>

      <div
        v-show="dropdownOpen"
        class="dropdown"
        role="listbox"
        @click.stop
      >
        <button
          type="button"
          class="dropdown-item dropdown-item--action"
          @click.stop="openCreateWorkspaceModal"
        >
          <span class="dropdown-item-label">New workspace</span>
          <img :src="addIcon" alt="" class="dropdown-add-icon" />
        </button>

        <template v-if="workspaceStore.workspaces.length > 1">
          <div class="dropdown-divider" />
          <div class="workspace-list-scroll">
            <button
              v-for="ws in workspaceStore.workspaces"
              :key="ws.id"
              type="button"
              class="dropdown-item dropdown-item--workspace"
              :class="{
                'is-current':
                  workspaceStore.activeWorkspace?.id === ws.id,
              }"
              role="option"
              :aria-selected="workspaceStore.activeWorkspace?.id === ws.id"
              @click="handlePickWorkspace(ws)"
            >
              <div class="avatar avatar--sm">
                {{ ws.name?.charAt(0) || '?' }}
              </div>
              <span class="dropdown-item-label">{{ ws.name }}</span>
            </button>
          </div>
        </template>
      </div>
    </template>

    <button
      v-else
      type="button"
      class="workspace-switcher workspace-switcher--create"
      @click.stop="workspaceStore.openCreateWorkspacePopup()"
    >
      <span class="truncate">Create workspace</span>
      <img :src="addIcon" alt="" class="icon" />
    </button>
  </div>
</template>

<style scoped>
.picker-root {
  position: relative;
}

.loading-placeholder {
  padding: 12px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 14px;
}

.workspace-switcher {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

button.workspace-switcher {
  border: none;
  margin: 0;
  background: transparent;
  font: inherit;
  color: inherit;
  text-align: left;
}

.workspace-switcher:hover {
  background: rgba(255, 255, 255, 0.084);
}

.avatar {
  width: 32px;
  height: 32px;
  background: #4a4a4a;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  flex-shrink: 0;
}

.avatar--sm {
  width: 28px;
  height: 28px;
  font-size: 13px;
}

.truncate {
  flex: 1;
  min-width: 0;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-left: auto;
  opacity: 0.7;
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.icon--open {
  transform: rotate(180deg);
}

.workspace-switcher:hover .icon {
  opacity: 1;
}

.dropdown {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + 4px);
  top: auto;
  z-index: 40;
  padding: 4px;
  border-radius: 12px;
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.45);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px 4px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.dropdown-item--action {
  justify-content: flex-start;
}

.dropdown-add-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-left: auto;
  opacity: 0.75;
}

.dropdown-item--workspace.is-current {
  background: rgba(255, 255, 255, 0.08);
}

.dropdown-item-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-divider {
  height: 1px;
  margin: 1px 4px 3px;
  background: rgba(255, 255, 255, 0.1);
}

.workspace-list-scroll {
  max-height: 176px;
  overflow-y: auto;
}
</style>
