<script setup lang="ts">
import type { WorkspaceMember, WorkspaceMemberRole } from '@/composables/useWorkspaceMembers'
import SettingsMemberRow from '@/components/settings/SettingsMemberRow.vue'

defineProps<{
  members: WorkspaceMember[]
  membersLoading: boolean
  ownerId: string
  canManageWorkspace: boolean
  memberRoleLabel: (member: WorkspaceMember, ownerId: string) => string
}>()

const emit = defineEmits<{
  share: []
  roleChange: [memberId: string, role: WorkspaceMemberRole]
}>()
</script>

<template>
  <div class="settings-row">
    <p class="text-sm text-white">Workspace members</p>
    <button
      v-if="canManageWorkspace"
      type="button"
      class="settings-btn settings-btn--share"
      @click="emit('share')"
    >
      Share
    </button>
  </div>

  <div v-if="membersLoading" class="text-sm text-white/50">
    Loading members…
  </div>
  <div v-else class="flex flex-col gap-4">
    <SettingsMemberRow
      v-for="member in members"
      :key="member.id"
      :member="member"
      :role-label="memberRoleLabel(member, ownerId)"
      :is-owner="member.user.id === ownerId"
      :can-edit-role="canManageWorkspace"
      @role-change="(role) => emit('roleChange', member.id, role)"
    />
  </div>
</template>
