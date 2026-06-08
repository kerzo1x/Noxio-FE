<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { WorkspaceMember, WorkspaceMemberRole } from '@/composables/useWorkspaceMembers'
import selectorIcon from '@/assets/img/selector.svg'

const props = defineProps<{
  member: WorkspaceMember
  roleLabel: string
  isOwner: boolean
  canEditRole: boolean
}>()

const emit = defineEmits<{
  roleChange: [role: WorkspaceMemberRole]
}>()

const roleOptions: { value: WorkspaceMemberRole; label: string }[] = [
  { value: 'VIEWER', label: 'Viewer' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'ADMIN', label: 'Admin' },
]

const menuRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)

const displayName = `${props.member.user.name} ${props.member.user.surname}`.trim()
const initials =
  `${props.member.user.name.charAt(0)}${props.member.user.surname.charAt(0)}`.toUpperCase()

function toggleMenu() {
  if (!props.canEditRole || props.isOwner) return
  isOpen.value = !isOpen.value
}

function pickRole(role: WorkspaceMemberRole) {
  isOpen.value = false
  emit('roleChange', role)
}

function onDocumentClick(e: MouseEvent) {
  if (!isOpen.value || !menuRef.value) return
  if (menuRef.value.contains(e.target as Node)) return
  isOpen.value = false
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div class="settings-member-row">
    <div class="settings-member-row__avatar">
      <span>{{ initials }}</span>
    </div>
    <p class="settings-member-row__name">{{ displayName }}</p>
    <p class="settings-member-row__email">{{ member.user.email }}</p>

    <span v-if="isOwner" class="settings-role-badge">Owner</span>

    <div v-else ref="menuRef" class="settings-role-select">
      <button
        type="button"
        class="settings-role-select__trigger"
        :disabled="!canEditRole"
        @click.stop="toggleMenu"
      >
        {{ roleLabel }}
        <img
          v-if="canEditRole"
          :src="selectorIcon"
          alt=""
          class="ml-1 size-3"
        />
      </button>
      <div v-show="isOpen" class="settings-role-select__menu">
        <button
          v-for="opt in roleOptions"
          :key="opt.value"
          type="button"
          class="settings-role-select__option"
          @click="pickRole(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
  </div>
</template>
