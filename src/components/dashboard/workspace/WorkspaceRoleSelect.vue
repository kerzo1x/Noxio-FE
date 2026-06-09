<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { WorkspaceMemberRole } from '@/composables/useWorkspaceMembers'
import selectorIcon from '@/assets/img/selector.svg'

const model = defineModel<WorkspaceMemberRole>({ required: true })

const roleOptions: { value: WorkspaceMemberRole; label: string }[] = [
  { value: 'VIEWER', label: 'Viewer' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'ADMIN', label: 'Admin' },
]

const roleSelectRef = ref<HTMLElement | null>(null)
const isRoleOpen = ref(false)

const selectedRoleLabel = computed(
  () =>
    roleOptions.find((option) => option.value === model.value)?.label ?? 'Role',
)

// TODO: tu mixujes arrow functions a regular functions ... napr. closeRoleSelect je arrow function a onDocumentClick je regular function
const closeRoleSelect = () => {
  isRoleOpen.value = false
}

const toggleRoleSelect = () => {
  isRoleOpen.value = !isRoleOpen.value
}

const pickRole = (role: WorkspaceMemberRole) => {
  model.value = role
  closeRoleSelect()
}

const onDocumentClick = (e: MouseEvent) => {
  if (!isRoleOpen.value || !roleSelectRef.value) return
  if (roleSelectRef.value.contains(e.target as Node)) return
  closeRoleSelect()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})

defineExpose({ isRoleOpen, closeRoleSelect })
</script>

<template>
  <div ref="roleSelectRef" class="workspace-popup-role-select">
    <button
      type="button"
      class="workspace-popup-role-trigger"
      :aria-expanded="isRoleOpen"
      aria-haspopup="listbox"
      @click.stop="toggleRoleSelect"
    >
      <span class="workspace-popup-role-label">{{ selectedRoleLabel }}</span>
      <img
        :src="selectorIcon"
        alt=""
        class="workspace-popup-role-chevron"
        :class="{ 'workspace-popup-role-chevron--open': isRoleOpen }"
      />
    </button>

    <div
      v-show="isRoleOpen"
      class="workspace-popup-role-menu"
      role="listbox"
      aria-label="Member role"
      @click.stop
    >
      <button
        v-for="option in roleOptions"
        :key="option.value"
        type="button"
        role="option"
        class="workspace-popup-role-option"
        :class="{
          'workspace-popup-role-option--active': model === option.value,
        }"
        :aria-selected="model === option.value"
        @click="pickRole(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.workspace-popup-role-select {
  @apply relative shrink-0;
}

.workspace-popup-role-trigger {
  @apply flex h-9 cursor-pointer items-center gap-1.5 rounded-md border-0 bg-white/5 px-3 text-xs font-medium tracking-tight text-white/70 outline-none transition-colors hover:bg-white/8 hover:text-white/90;
}

.workspace-popup-role-label {
  @apply whitespace-nowrap;
}

.workspace-popup-role-chevron {
  @apply h-3.5 w-3.5 shrink-0 opacity-50 transition-[opacity,transform] duration-200;
}

.workspace-popup-role-chevron--open {
  @apply rotate-180 opacity-80;
}

.workspace-popup-role-menu {
  @apply absolute right-0 top-[calc(100%+4px)] z-10 min-w-full rounded-lg border border-white/8 bg-[#1a1a1a] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.45)];
}

.workspace-popup-role-option {
  @apply flex w-full cursor-pointer items-center rounded-md border-0 bg-transparent px-3 py-2 text-left text-xs font-medium tracking-tight text-white/60 transition-colors hover:bg-white/5 hover:text-white;
}

.workspace-popup-role-option--active {
  @apply bg-white/8 text-white;
}
</style>
