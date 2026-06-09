<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useWorkspaceStore } from '@/stores/workspace'
import { useWorkspaceMembers } from '@/composables/useWorkspaceMembers'
import { uploadMedia, listWorkspaceMedia } from '@/api/media'
import { updateWorkspace, updateMemberRole, createInvitation } from '@/api/workspaces'
import type { WorkspaceMemberRole } from '@/composables/useWorkspaceMembers'
import SettingsAvatarBlock from '@/components/settings/SettingsAvatarBlock.vue'
import SettingsSharePopup from '@/components/settings/SettingsSharePopup.vue'
import SettingsWorkspaceNameForm from '@/components/settings/SettingsWorkspaceNameForm.vue'
import SettingsWorkspaceMembersList from '@/components/settings/SettingsWorkspaceMembersList.vue'

const workspaceStore = useWorkspaceStore()
const { activeWorkspace } = storeToRefs(workspaceStore)

const {
  members,
  isLoading: membersLoading,
  memberRoleLabel,
  fetchMembers,
} = useWorkspaceMembers()

const workspaceName = ref('')
const workspaceAvatarUrl = ref<string | null>(null)
const isSavingName = ref(false)
const isUploadingAvatar = ref(false)
const showSharePopup = ref(false)
const message = ref('')
const isError = ref(false)

const workspaceId = computed(() => activeWorkspace.value?.id ?? null)
const ownerId = computed(() => activeWorkspace.value?.ownerId ?? '')
const canManageWorkspace = computed(
  () => activeWorkspace.value?.role === 'ADMIN',
)

const initials = computed(() => {
  const name = activeWorkspace.value?.name?.charAt(0) ?? 'W'
  return name.toUpperCase()
})

function syncName() {
  workspaceName.value = activeWorkspace.value?.name ?? ''
}

watch(activeWorkspace, syncName, { immediate: true })

async function loadWorkspaceAvatar(id: string) {
  try {
    const { data } = await listWorkspaceMedia(id)
    if (!data.success) return
    const avatars = (data.data ?? []).filter((m) => m.type === 'WORKSPACE_AVATAR')
    const latest = avatars.at(-1)
    workspaceAvatarUrl.value = latest?.fileUrl ?? null
  } catch {
    workspaceAvatarUrl.value = null
  }
}

watch(
  workspaceId,
  async (id) => {
    if (!id) return
    await fetchMembers(id, true)
    await loadWorkspaceAvatar(id)
  },
  { immediate: true },
)

onMounted(syncName)

async function handleSaveName() {
  const id = workspaceId.value
  const name = workspaceName.value.trim()
  if (!id || !name || isSavingName.value) return

  isSavingName.value = true
  isError.value = false
  message.value = ''
  try {
    const { data } = await updateWorkspace(id, { name })
    if (!data.success) {
      throw new Error(data.message || 'Failed to update workspace.')
    }
    // TODO: backend — возвращает ли PATCH /workspaces/{id} avatarUrl в ответе?
    await workspaceStore.fetchWorkspaces({ force: true })
    message.value = 'Workspace name updated.'
  } catch (err) {
    isError.value = true
    message.value =
      err instanceof Error ? err.message : 'Failed to update workspace.'
  } finally {
    isSavingName.value = false
  }
}

async function handleChangeImage(file: File) {
  const id = workspaceId.value
  if (!id) return

  isUploadingAvatar.value = true
  isError.value = false
  message.value = ''
  try {
    const { data: uploadRes } = await uploadMedia(file, {
      type: 'WORKSPACE_AVATAR',
      workspaceId: id,
    })
    if (!uploadRes.success) {
      throw new Error(uploadRes.message || 'Upload failed')
    }
    workspaceAvatarUrl.value = uploadRes.data.fileUrl
    message.value = 'Workspace image updated.'
  } catch (err) {
    isError.value = true
    message.value =
      err instanceof Error ? err.message : 'Failed to update workspace image.'
  } finally {
    isUploadingAvatar.value = false
  }
}

function handleRemoveImage() {
  workspaceAvatarUrl.value = null
  message.value = 'Workspace image removed locally.'
  // TODO: backend — endpoint удаления workspace avatar, если появится
}

async function handleRoleChange(
  memberId: string,
  role: WorkspaceMemberRole,
) {
  const id = workspaceId.value
  if (!id || !canManageWorkspace.value) return

  try {
    await updateMemberRole(id, memberId, role)
    await fetchMembers(id, true)
    message.value = 'Member role updated.'
    isError.value = false
  } catch (err) {
    isError.value = true
    message.value =
      err instanceof Error ? err.message : 'Failed to update role.'
  }
}

async function handleShare(payload: {
  email: string
  role: WorkspaceMemberRole
}) {
  const id = workspaceId.value
  if (!id) return

  try {
    await createInvitation(id, payload.email, payload.role)
    message.value = 'Invitation sent.'
    isError.value = false
  } catch (err) {
    isError.value = true
    message.value =
      err instanceof Error ? err.message : 'Failed to send invitation.'
  }
}
</script>

<template>
  <div class="settings-section">
    <h2 class="settings-section-title settings-section-title--lg">
      Workspace settings
    </h2>

    <div v-if="!workspaceId" class="text-sm text-white/50">
      No active workspace selected.
    </div>

    <template v-else>
      <SettingsAvatarBlock
        size="workspace"
        :avatar-url="workspaceAvatarUrl"
        :initials="initials"
        :disabled="!canManageWorkspace || isUploadingAvatar"
        @change-image="handleChangeImage"
        @remove-image="handleRemoveImage"
      />

      <div class="mt-12 flex max-w-[760px] flex-col gap-12">
        <SettingsWorkspaceNameForm
          v-model="workspaceName"
          :disabled="!canManageWorkspace"
          :is-saving="isSavingName"
          @save="handleSaveName"
        />

        <SettingsWorkspaceMembersList
          :members="members"
          :members-loading="membersLoading"
          :owner-id="ownerId"
          :can-manage-workspace="canManageWorkspace"
          :member-role-label="memberRoleLabel"
          @share="showSharePopup = true"
          @role-change="handleRoleChange"
        />
      </div>

      <p
        v-if="message"
        class="settings-message mt-6"
        :class="{ 'settings-message--success': !isError }"
      >
        {{ message }}
      </p>

      <SettingsSharePopup v-model="showSharePopup" @share="handleShare" />
    </template>
  </div>
</template>
