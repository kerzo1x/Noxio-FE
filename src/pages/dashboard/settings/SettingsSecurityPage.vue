<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import SettingsField from '@/components/settings/SettingsField.vue'
import SettingsToggle from '@/components/settings/SettingsToggle.vue'
import SettingsDeleteAccountPopup from '@/components/settings/SettingsDeleteAccountPopup.vue'
import SettingsOtpPopup from '@/components/settings/SettingsOtpPopup.vue'

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const newPassword = ref('')
const confirmPassword = ref('')
const passwordMismatch = computed(
  () =>
    confirmPassword.value.length > 0 &&
    newPassword.value !== confirmPassword.value,
)

const showDeletePopup = ref(false)
const showOtpPopup = ref(false)
const otpSessionToken = ref('')
const otpMode = ref<'2fa' | 'delete-account'>('2fa')
const isToggling2fa = ref(false)
const message = ref('')
const isError = ref(false)


onMounted(() => {
  void userStore.fetchUser({ force: true })
})

async function handle2faToggle(enabled: boolean) {
  if (isToggling2fa.value || !user.value) return
  isToggling2fa.value = true
  isError.value = false
  message.value = ''

  try {
    if (enabled) {
      const { data } = await userStore.enable2fa()
      if (!data.success || !data.data.sessionToken) {
        throw new Error(data.message || 'Failed to enable 2FA.')
      }
      otpSessionToken.value = data.data.sessionToken
      localStorage.setItem('session_token', data.data.sessionToken)
      otpMode.value = '2fa'
      showOtpPopup.value = true
    } else {
      await userStore.disable2fa()
      message.value = '2FA disabled.'
    }
  } catch (err) {
    isError.value = true
    message.value =
      err instanceof Error ? err.message : 'Failed to update 2FA.'
  } finally {
    isToggling2fa.value = false
  }
}

function on2faSuccess() {
  void userStore.fetchUser({ force: true })
  message.value = '2FA enabled.'
}

function onDeleteInitiated(sessionToken: string) {
  otpSessionToken.value = sessionToken
  otpMode.value = 'delete-account'
  showOtpPopup.value = true
}

</script>

<template>
  <div class="settings-section">
    <h2 class="settings-section-title">Account security</h2>

    <div class="flex max-w-[873px] flex-col gap-[63px]">
      <div class="settings-row items-start">
        <SettingsField label="Password" masked class="max-w-[314px] flex-1" />
      </div>

      <!-- TODO: backend — уточнить endpoint (`PATCH /auth/me` с password или отдельный) -->
      <div class="flex max-w-[873px] flex-col gap-4">
        <p class="text-sm text-white">Change password</p>
        <div class="grid max-w-[649px] grid-cols-2 gap-x-[19px] gap-y-4">
          <SettingsField
            v-model="newPassword"
            label="New password"
            type="password"
            disabled
          />
          <SettingsField
            v-model="confirmPassword"
            label="Confirm password"
            type="password"
            disabled
          />
        </div>
        <p v-if="passwordMismatch" class="settings-message text-xs">
          Passwords do not match.
        </p>
        <button
          type="button"
          class="settings-btn settings-btn--primary settings-btn--save"
          disabled
          title="Waiting for backend password change endpoint"
        >
          Save
        </button>
      </div>

      <div class="settings-row">
        <div class="settings-row__text">
          <p class="settings-row__title">2FA verification</p>
          <p class="settings-row__desc">
            Verification through email with a short code
          </p>
        </div>
        <SettingsToggle
          :model-value="user?.twoFactorEnabled ?? false"
          :disabled="isToggling2fa"
          @update:model-value="handle2faToggle"
        />
      </div>

      <div class="settings-row">
        <div class="settings-row__text">
          <p class="settings-row__title">Delete my account</p>
          <p class="settings-row__desc">Delete all my data and account</p>
        </div>
        <button
          type="button"
          class="settings-btn settings-btn--danger-outline settings-btn--compact"
          @click="showDeletePopup = true"
        >
          Delete my account
        </button>
      </div>
    </div>

    <p
      v-if="message"
      class="settings-message mt-6"
      :class="{ 'settings-message--success': !isError }"
    >
      {{ message }}
    </p>

    <SettingsDeleteAccountPopup
      v-model="showDeletePopup"
      @initiated="onDeleteInitiated"
    />

    <SettingsOtpPopup
      v-model="showOtpPopup"
      :title="
        otpMode === 'delete-account'
          ? 'Enter the code to confirm account deletion'
          : 'Enter the code to enable 2FA'
      "
      :session-token="otpSessionToken"
      :confirm-mode="otpMode"
      @success="on2faSuccess"
    />
  </div>
</template>
