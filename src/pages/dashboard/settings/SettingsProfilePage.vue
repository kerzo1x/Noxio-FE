<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { userAvatarUrl } from '@/api/user'
import { uploadMedia } from '@/api/media'
import SettingsAvatarBlock from '@/components/settings/SettingsAvatarBlock.vue'
import SettingsField from '@/components/settings/SettingsField.vue'

const userStore = useUserStore()
const { user, loading } = storeToRefs(userStore)

const firstName = ref('')
const lastName = ref('')
const isSavingName = ref(false)
const isUploadingAvatar = ref(false)
const message = ref('')
const isError = ref(false)

const avatarUrl = computed(() => userAvatarUrl(user.value))
const initials = computed(() => {
  const n = user.value?.name?.charAt(0) ?? ''
  const s = user.value?.surname?.charAt(0) ?? ''
  return (n + s).toUpperCase() || '?'
})

function syncFormFromUser() {
  if (!user.value) return
  firstName.value = user.value.name
  lastName.value = user.value.surname
}

watch(user, syncFormFromUser, { immediate: true })

onMounted(() => {
  void userStore.fetchUser({ force: true })
})

async function handleChangeImage(file: File) {
  isUploadingAvatar.value = true
  isError.value = false
  message.value = ''
  try {
    const { data: uploadRes } = await uploadMedia(file, { type: 'USER_AVATAR' })
    if (!uploadRes.success) {
      throw new Error(uploadRes.message || 'Upload failed')
    }
    await userStore.setAvatar(uploadRes.data.id)
    message.value = 'Avatar updated.'
  } catch (err) {
    isError.value = true
    message.value =
      err instanceof Error ? err.message : 'Failed to update avatar.'
  } finally {
    isUploadingAvatar.value = false
  }
}

async function handleRemoveImage() {
  isUploadingAvatar.value = true
  isError.value = false
  message.value = ''
  try {
    await userStore.removeAvatar()
    message.value = 'Avatar removed.'
  } catch (err) {
    isError.value = true
    message.value =
      err instanceof Error ? err.message : 'Failed to remove avatar.'
  } finally {
    isUploadingAvatar.value = false
  }
}

async function handleSaveName() {
  const name = firstName.value.trim()
  const surname = lastName.value.trim()
  if (!name || !surname) {
    isError.value = true
    message.value = 'First and last name are required.'
    return
  }

  isSavingName.value = true
  isError.value = false
  message.value = ''
  try {
    const result = await userStore.updateProfile({ name, surname })
    if (!result.success) {
      throw new Error(result.message || 'Failed to update name.')
    }
    message.value = 'Name updated.'
  } catch (err) {
    isError.value = true
    message.value =
      err instanceof Error ? err.message : 'Failed to update name.'
  } finally {
    isSavingName.value = false
  }
}
</script>

<template>
  <div class="settings-section">
    <h2 class="settings-section-title">My Profile</h2>

    <div v-if="loading && !user" class="text-sm text-white/50">
      Loading profile…
    </div>

    <template v-else-if="user">
      <SettingsAvatarBlock
        :avatar-url="avatarUrl"
        :initials="initials"
        :disabled="isUploadingAvatar"
        @change-image="handleChangeImage"
        @remove-image="handleRemoveImage"
      />

      <div class="mt-[60px] flex max-w-[873px] flex-col gap-8">
        <div class="settings-name-grid">
          <SettingsField v-model="firstName" label="First name" />
          <SettingsField v-model="lastName" label="Last name" />
          <button
            type="button"
            class="settings-btn settings-btn--primary settings-btn--save col-span-2"
            :disabled="isSavingName"
            @click="handleSaveName"
          >
            {{ isSavingName ? 'Saving…' : 'Change your name' }}
          </button>
        </div>

        <SettingsField
          :model-value="user.email"
          label="Email"
          readonly
        />
      </div>

      <p
        v-if="message"
        class="settings-message mt-4"
        :class="{ 'settings-message--success': !isError }"
      >
        {{ message }}
      </p>
    </template>
  </div>
</template>
