<script setup lang="ts">
import { ref } from 'vue'
import type { WorkspaceMemberRole } from '@/composables/useWorkspaceMembers'
import WorkspaceRoleSelect from '@/components/dashboard/workspace/WorkspaceRoleSelect.vue'
import WorkspaceInviteList, {
  type PendingInvite,
} from '@/components/dashboard/workspace/WorkspaceInviteList.vue'

const roleSelectRef = ref<InstanceType<typeof WorkspaceRoleSelect> | null>(null)

defineProps<{
  inviteMessage: string
  isInviteError: boolean
  pendingInvites: PendingInvite[]
}>()

const inviteEmail = defineModel<string>('inviteEmail', { required: true })
const inviteRole = defineModel<WorkspaceMemberRole>('inviteRole', {
  required: true,
})

const emit = defineEmits<{
  add: []
  'clear-feedback': []
  remove: [id: string]
}>()

defineExpose({
  get isRoleOpen() {
    return roleSelectRef.value?.isRoleOpen ?? false
  },
  closeRoleSelect() {
    roleSelectRef.value?.closeRoleSelect()
  },
})
</script>

<template>
  <div class="workspace-popup-invite">
    <p class="workspace-popup-invite-label">Add member to your workspace</p>

    <div class="workspace-popup-invite-row">
      <input
        id="workspace-invite-email"
        v-model="inviteEmail"
        type="text"
        name="member-email"
        placeholder="Email"
        class="workspace-popup-email"
        autocomplete="off"
        @input="emit('clear-feedback')"
      />

      <WorkspaceRoleSelect ref="roleSelectRef" v-model="inviteRole" />

      <button
        type="button"
        class="workspace-popup-add"
        :disabled="!inviteEmail.trim()"
        @click="emit('add')"
      >
        Add
      </button>
    </div>

    <p
      v-if="inviteMessage"
      class="workspace-popup-feedback"
      :class="{ 'workspace-popup-feedback--error': isInviteError }"
    >
      {{ inviteMessage }}
    </p>

    <WorkspaceInviteList
      :invites="pendingInvites"
      @remove="emit('remove', $event)"
    />
  </div>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.workspace-popup-invite {
  @apply flex w-full flex-col gap-5;
}

.workspace-popup-invite-label {
  @apply text-xs font-medium leading-normal tracking-tight text-white;
}

.workspace-popup-invite-row {
  @apply flex h-9 w-full items-center gap-2;
}

.workspace-popup-email {
  @apply min-w-0 flex-1 border-0 bg-transparent px-2 text-sm font-medium tracking-tight text-white outline-none placeholder:text-white/35 focus:ring-0;
}

.workspace-popup-add {
  @apply flex h-9 shrink-0 items-center justify-center rounded-md bg-[#6584e2] px-5 text-xs font-medium leading-none text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40;
}

.workspace-popup-feedback {
  @apply text-center text-xs font-medium text-white/70;
}

.workspace-popup-feedback--error {
  @apply text-red-400;
}
</style>
