<script setup lang="ts">
import { ref, watch } from 'vue'
import { useEscapeKey } from '@/composables/useEscapeKey'
import { useWorkspaceStore } from '@/stores/workspace'
import type { WorkspaceMemberRole } from '@/composables/useWorkspaceMembers'
import WorkspaceCreateForm from '@/components/dashboard/workspace/WorkspaceCreateForm.vue'
import WorkspaceInviteForm from '@/components/dashboard/workspace/WorkspaceInviteForm.vue'
import type { PendingInvite } from '@/components/dashboard/workspace/WorkspaceInviteList.vue'

const workspaceStore = useWorkspaceStore()
const inviteFormRef = ref<InstanceType<typeof WorkspaceInviteForm> | null>(null)

const name = ref('')
const inviteEmail = ref('')
const inviteRole = ref<WorkspaceMemberRole>('EDITOR')
const pendingInvites = ref<PendingInvite[]>([])

const isSubmitting = ref(false)
const isError = ref(false)
const message = ref('')
const inviteMessage = ref('')
const isInviteError = ref(false)

const resetForm = () => {
  name.value = ''
  inviteEmail.value = ''
  inviteRole.value = 'EDITOR'
  pendingInvites.value = []
  isError.value = false
  message.value = ''
  inviteMessage.value = ''
  isInviteError.value = false
  isSubmitting.value = false
  inviteFormRef.value?.closeRoleSelect()
}

const close = () => {
  resetForm()
  workspaceStore.closeCreateWorkspacePopup()
}

watch(
  () => workspaceStore.showCreateWorkspacePopup,
  (open) => {
    if (open) resetForm()
  },
)

useEscapeKey(() => {
  if (inviteFormRef.value?.isRoleOpen) {
    inviteFormRef.value.closeRoleSelect()
    return
  }
  if (workspaceStore.showCreateWorkspacePopup) close()
})

const clearWorkspaceError = () => {
  isError.value = false
  message.value = ''
}

const clearInviteFeedback = () => {
  isInviteError.value = false
  inviteMessage.value = ''
}

const handleAdd = () => {
  const email = inviteEmail.value.trim().toLowerCase()
  if (!email) return

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    isInviteError.value = true
    inviteMessage.value = 'Enter a valid email address.'
    return
  }

  if (pendingInvites.value.some((invite) => invite.email === email)) {
    isInviteError.value = true
    inviteMessage.value = 'This email is already in the list.'
    return
  }

  pendingInvites.value.push({
    id: crypto.randomUUID(),
    email,
    role: inviteRole.value,
  })
  inviteEmail.value = ''
  isInviteError.value = false
  inviteMessage.value = ''
}

const removePendingInvite = (id: string) => {
  pendingInvites.value = pendingInvites.value.filter(
    (invite) => invite.id !== id,
  )
}

const handleSubmit = async () => {
  const trimmed = name.value.trim()
  if (!trimmed || isSubmitting.value) return

  isSubmitting.value = true
  isError.value = false
  message.value = ''

  try {
    const created = await workspaceStore.createWorkspace(trimmed)
    const workspaceId =
      created?.id ??
      workspaceStore.activeWorkspace?.id ??
      workspaceStore.workspaces.find((w) => w.name === trimmed)?.id ??
      null

    if (!workspaceId) {
      throw new Error('Workspace was created but could not be resolved.')
    }

    if (pendingInvites.value.length > 0) {
      const results = await Promise.allSettled(
        pendingInvites.value.map((invite) =>
          workspaceStore.createInvitation(
            workspaceId,
            invite.email,
            invite.role,
          ),
        ),
      )

      const failed = results.filter((result) => result.status === 'rejected')
      if (failed.length > 0 && failed.length === results.length) {
        throw new Error('Workspace created, but invitations could not be sent.')
      }
    }

    close()
  } catch (err) {
    isError.value = true
    message.value =
      err instanceof Error ? err.message : 'Failed to create workspace.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="workspaceStore.showCreateWorkspacePopup"
      class="workspace-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-popup-title"
    >
      <div class="workspace-popup-backdrop" aria-hidden="true" @click="close" />

      <div class="workspace-popup-card" @click.stop>
        <form class="workspace-popup-form" @submit.prevent="handleSubmit">
          <div class="workspace-popup-body">
            <WorkspaceCreateForm
              v-model="name"
              :is-error="isError"
              @input="clearWorkspaceError"
            />

            <WorkspaceInviteForm
              ref="inviteFormRef"
              v-model:invite-email="inviteEmail"
              v-model:invite-role="inviteRole"
              :invite-message="inviteMessage"
              :is-invite-error="isInviteError"
              :pending-invites="pendingInvites"
              @add="handleAdd"
              @clear-feedback="clearInviteFeedback"
              @remove="removePendingInvite"
            />
          </div>

          <div class="workspace-popup-footer">
            <button
              type="submit"
              class="workspace-popup-submit"
              :disabled="isSubmitting || !name.trim()"
            >
              {{ isSubmitting ? 'Loading...' : 'Create workspace' }}
            </button>
            <p
              v-if="message"
              class="workspace-popup-feedback workspace-popup-feedback--error"
            >
              {{ message }}
            </p>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.workspace-popup-overlay {
  @apply fixed inset-0 z-100 flex items-center justify-center p-4;
}

.workspace-popup-backdrop {
  @apply absolute inset-0 bg-black/60 backdrop-blur-sm;
}

.workspace-popup-card {
  @apply relative z-1 box-border w-full max-w-2xl shrink-0 rounded-xl border-2 border-neutral-900 bg-black px-18 pb-10 pt-9.5;
}

.workspace-popup-form {
  @apply flex w-full flex-col gap-20;
}

.workspace-popup-body {
  @apply flex w-full flex-col gap-11;
}

.workspace-popup-footer {
  @apply flex w-full flex-col gap-3;
}

.workspace-popup-submit {
  @apply flex w-full items-center justify-center rounded-xl bg-white px-3 py-4 text-base font-medium leading-none tracking-wide text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40;
}

.workspace-popup-feedback {
  @apply text-center text-xs font-medium text-white/70;
}

.workspace-popup-feedback--error {
  @apply text-red-400;
}
</style>
