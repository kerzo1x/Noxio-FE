<script setup>
// TODO: v script setup chyba typescript
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
  <div ref="rootRef" class="relative">
    <div
      v-if="workspaceStore.isLoading && workspaceStore.workspaces.length === 0"
      class="p-3 text-white/45 text-sm"
    >
      Checking workspaces...
    </div>

    <template v-else-if="workspaceStore.workspaces.length > 0">
      <div
        class="group flex items-center gap-3 w-full p-3 rounded-xl cursor-pointer transition-[color,opacity] duration-200"
        role="button"
        tabindex="0"
        :aria-expanded="dropdownOpen"
        aria-haspopup="listbox"
        @click="toggleDropdown"
        @keydown.enter.prevent="toggleDropdown"
        @keydown.space.prevent="toggleDropdown"
      >
        <div class="w-8 h-8 bg-[#4a4a4a] rounded-md flex items-center justify-center text-white font-semibold shrink-0">
          {{ workspaceStore.activeWorkspace?.name?.charAt(0) || '?' }}
        </div>
        <span class="flex-1 min-w-0 truncate text-sm font-medium text-white/50 transition-colors duration-200 group-hover:text-white">
          {{ workspaceStore.activeWorkspace?.name || 'Loading...' }}
        </span>
        <img
          :src="selectorIcon"
          alt=""
          class="w-5 h-5 shrink-0 ml-auto opacity-50 transition-[opacity,transform] duration-200 group-hover:opacity-100"
          :class="{ 'rotate-180': dropdownOpen }"
        />
      </div>

      <div
        v-show="dropdownOpen"
        class="absolute left-0 right-0 bottom-[calc(100%+4px)] z-40 p-1 rounded-xl bg-[#1a1a1a] border border-white/[0.08] shadow-[0_-8px_32px_rgba(0,0,0,0.45)]"
        role="listbox"
        @click.stop
      >
        <button
          type="button"
          class="group flex items-center gap-2.5 w-full pt-2 px-2.5 pb-1 rounded-lg text-sm font-medium text-left cursor-pointer text-white/50 transition-colors duration-150 hover:text-white"
          @click.stop="openCreateWorkspaceModal"
        >
          <span class="flex-1 min-w-0 truncate">New workspace</span>
          <img :src="addIcon" alt="" class="w-[18px] h-[18px] shrink-0 ml-auto opacity-50 transition-opacity duration-150 group-hover:opacity-100" />
        </button>

        <template v-if="workspaceStore.workspaces.length > 1">
          <div class="h-px mx-1 mt-px mb-[3px] bg-white/10" />
          <div
            class="max-h-44 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <button
              v-for="ws in workspaceStore.workspaces"
              :key="ws.id"
              type="button"
              class="group flex items-center gap-2.5 w-full pt-2 px-2.5 pb-1 rounded-lg text-sm font-medium text-left cursor-pointer text-white/50 transition-colors duration-150 hover:text-white"
              :class="{ 'text-white': workspaceStore.activeWorkspace?.id === ws.id }"
              role="option"
              :aria-selected="workspaceStore.activeWorkspace?.id === ws.id"
              @click="handlePickWorkspace(ws)"
            >
              <div class="w-7 h-7 bg-[#4a4a4a] rounded-md flex items-center justify-center text-white font-semibold shrink-0 text-[13px]">
                {{ ws.name?.charAt(0) || '?' }}
              </div>
              <span class="flex-1 min-w-0 truncate">{{ ws.name }}</span>
            </button>
          </div>
        </template>
      </div>
    </template>

    <button
      v-else
      type="button"
      class="group flex items-center gap-3 w-full p-3 rounded-xl cursor-pointer text-left transition-[color,opacity] duration-200"
      @click.stop="workspaceStore.openCreateWorkspacePopup()"
    >
      <span class="flex-1 min-w-0 text-sm font-medium truncate text-white/50 transition-colors duration-200 group-hover:text-white">Create workspace</span>
      <img :src="addIcon" alt="" class="w-5 h-5 shrink-0 ml-auto opacity-50 transition-opacity duration-200 group-hover:opacity-100" />
    </button>
  </div>
</template>
