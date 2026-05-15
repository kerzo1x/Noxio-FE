<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace'
import type { WorkspaceMemberRole } from '@/composables/useWorkspaceMembers'
import selectorIcon from '@/assets/img/selector.svg'

const workspaceStore = useWorkspaceStore()

interface PendingInvite {
  id: string
  email: string
  role: WorkspaceMemberRole
}

const name = ref('')
const inviteEmail = ref('')
const inviteRole = ref<WorkspaceMemberRole>('EDITOR')
const pendingInvites = ref<PendingInvite[]>([])

const isSubmitting = ref(false)
const isError = ref(false)
const message = ref('')
const inviteMessage = ref('')
const isInviteError = ref(false)

const roleOptions: { value: WorkspaceMemberRole; label: string }[] = [
  { value: 'VIEWER', label: 'Viewer' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'ADMIN', label: 'Admin' },
]

const roleSelectRef = ref<HTMLElement | null>(null)
const isRoleOpen = ref(false)

const selectedRoleLabel = computed(
  () =>
    roleOptions.find((option) => option.value === inviteRole.value)?.label ??
    'Role',
)

function roleLabel(role: WorkspaceMemberRole): string {
  return roleOptions.find((option) => option.value === role)?.label ?? role
}

const closeRoleSelect = () => {
  isRoleOpen.value = false
}

const toggleRoleSelect = () => {
  isRoleOpen.value = !isRoleOpen.value
}

const pickRole = (role: WorkspaceMemberRole) => {
  inviteRole.value = role
  closeRoleSelect()
}

const onDocumentClick = (e: MouseEvent) => {
  if (!isRoleOpen.value || !roleSelectRef.value) return
  if (roleSelectRef.value.contains(e.target as Node)) return
  closeRoleSelect()
}

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
  closeRoleSelect()
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

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isRoleOpen.value) {
    closeRoleSelect()
    return
  }
  if (e.key === 'Escape' && workspaceStore.showCreateWorkspacePopup) close()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('click', onDocumentClick)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('click', onDocumentClick)
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
            <input
              id="workspace-popup-title"
              v-model="name"
              type="text"
              name="workspace-name"
              placeholder="Workspace name"
              class="workspace-popup-field"
              :class="{ 'workspace-popup-field--error': isError }"
              autocomplete="off"
              @input="clearWorkspaceError"
            />

            <div class="workspace-popup-invite">
              <p class="workspace-popup-invite-label">
                Add member to your workspace
              </p>

              <div class="workspace-popup-invite-row">
                <input
                  v-model="inviteEmail"
                  type="email"
                  name="member-email"
                  placeholder="Email"
                  class="workspace-popup-email"
                  autocomplete="off"
                  @input="clearInviteFeedback"
                />

                <div ref="roleSelectRef" class="workspace-popup-role-select">
                  <button
                    type="button"
                    class="workspace-popup-role-trigger"
                    :aria-expanded="isRoleOpen"
                    aria-haspopup="listbox"
                    @click.stop="toggleRoleSelect"
                  >
                    <span class="workspace-popup-role-label">{{
                      selectedRoleLabel
                    }}</span>
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
                        'workspace-popup-role-option--active':
                          inviteRole === option.value,
                      }"
                      :aria-selected="inviteRole === option.value"
                      @click="pickRole(option.value)"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  class="workspace-popup-add"
                  :disabled="!inviteEmail.trim()"
                  @click="handleAdd"
                >
                  Add
                </button>
              </div>

              <p
                v-if="inviteMessage"
                class="workspace-popup-feedback"
                :class="{
                  'workspace-popup-feedback--error': isInviteError,
                }"
              >
                {{ inviteMessage }}
              </p>

              <ul
                v-if="pendingInvites.length > 0"
                class="workspace-popup-pending"
              >
                <li
                  v-for="invite in pendingInvites"
                  :key="invite.id"
                  class="workspace-popup-pending-item"
                >
                  <div class="workspace-popup-pending-text">
                    <p class="workspace-popup-pending-email">
                      {{ invite.email }}
                    </p>
                    <p class="workspace-popup-pending-role">
                      {{ roleLabel(invite.role) }}
                    </p>
                  </div>
                  <button
                    type="button"
                    class="workspace-popup-pending-remove"
                    aria-label="Remove member"
                    @click="removePendingInvite(invite.id)"
                  >
                    Remove
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div class="workspace-popup-footer">
            <button
              type="submit"
              class="workspace-popup-submit"
              :disabled="isSubmitting || !name.trim()"
            >
              {{ isSubmitting ? 'Loading...' : 'Create workspace' }}
            </button>
            <p v-if="message" class="workspace-popup-feedback workspace-popup-feedback--error">
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

.workspace-popup-field {
  @apply box-border h-13 w-full rounded-xl border-0 bg-neutral-800 px-7 text-sm font-medium leading-normal tracking-tight text-white outline-none transition-shadow placeholder:text-white/50 focus:ring-1 focus:ring-white/20;
}

.workspace-popup-field--error {
  @apply ring-2 ring-red-500;
}

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

.workspace-popup-add {
  @apply flex h-9 shrink-0 items-center justify-center rounded-md bg-[#6584e2] px-5 text-xs font-medium leading-none text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40;
}

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
