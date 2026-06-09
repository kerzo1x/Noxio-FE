<script setup lang="ts">
import type { WorkspaceMemberRole } from '@/composables/useWorkspaceMembers'

export interface PendingInvite {
  id: string
  email: string
  role: WorkspaceMemberRole
}

defineProps<{
  invites: PendingInvite[]
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const roleOptions: { value: WorkspaceMemberRole; label: string }[] = [
  { value: 'VIEWER', label: 'Viewer' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'ADMIN', label: 'Admin' },
]

function roleLabel(role: WorkspaceMemberRole): string {
  return roleOptions.find((option) => option.value === role)?.label ?? role
}
</script>

<template>
  <ul v-if="invites.length > 0" class="workspace-popup-pending">
    <li
      v-for="invite in invites"
      :key="invite.id"
      class="workspace-popup-pending-item"
    >
      <div class="workspace-popup-pending-text">
        <p class="workspace-popup-pending-email">{{ invite.email }}</p>
        <p class="workspace-popup-pending-role">{{ roleLabel(invite.role) }}</p>
      </div>
      <button
        type="button"
        class="workspace-popup-pending-remove"
        aria-label="Remove member"
        @click="emit('remove', invite.id)"
      >
        Remove
      </button>
    </li>
  </ul>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.workspace-popup-pending {
  @apply flex max-h-40 flex-col gap-3 overflow-y-auto pt-1;
}

.workspace-popup-pending-item {
  @apply flex items-center justify-between gap-4;
}

.workspace-popup-pending-text {
  @apply min-w-0;
}

.workspace-popup-pending-email {
  @apply truncate text-xs font-medium leading-snug text-white;
}

.workspace-popup-pending-role {
  @apply truncate text-xs leading-snug text-white/50;
}

.workspace-popup-pending-remove {
  @apply shrink-0 cursor-pointer border-0 bg-transparent text-xs font-medium text-white/40 transition-colors hover:text-white/70;
}
</style>
