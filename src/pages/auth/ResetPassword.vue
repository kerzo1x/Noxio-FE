<script setup lang="ts">
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import BaseInput from '@/components/ui/inputs/BaseInput.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { resetPassword } from '@/api/auth'
import { clearPendingVerifyEmail } from '@/utils/authVerifySession'

const router = useRouter()
const password = ref('')
const confirmPassword = ref('')
const isError = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)

const handleResetPassword = async () => {

    if (password.value !== confirmPassword.value) {
        errorMessage.value = 'Passwords do not match'
        isError.value = true
        return
    }


    const sessionToken = localStorage.getItem('session_token')
    const verificationCode = localStorage.getItem('verification_code')

    if (!sessionToken || !verificationCode) {
        errorMessage.value = 'Session expired. Please start over.'
        isError.value = true
        setTimeout(() => router.push('/auth/forgot-password'), 3000)
        return
    }

    isLoading.value = true
    isError.value = false

    try {
        const { data: result } = await resetPassword({
            sessionToken,
            code: verificationCode,
            newPassword: password.value,
        })

        if (result.success) {
            localStorage.removeItem('session_token')
            localStorage.removeItem('verification_code')
            clearPendingVerifyEmail()

            router.push({ name: 'Login' })
        } else {
            errorMessage.value = result.message || 'Failed to reset password.'
            isError.value = true
        }
    } catch (error) {
        errorMessage.value = 'Network error. Please try again later.'
        isError.value = true
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-brand-black font-sans">
    <Transition name="auth-fade" appear>
    <div class="w-full max-w-sm space-y-8">

      <div class="space-y-2 max-w-xs mx-auto text-center">
        <h1 class="text-4xl font-bold text-brand-white">New password</h1>
        <p class="text-panel-label text-sm leading-relaxed">
          Create a new password for your account
        </p>
      </div>

      <form @submit.prevent="handleResetPassword" class="space-y-6">
        <div class="space-y-4">
          <base-input
              v-model="password"
              type="text"
              name="new-password"
              autocomplete="off"
              label="New Password"
              place-holder="Placeholder"
              :is-error="isError"
              @clear-error="isError = false"
          />
          <base-input
              v-model="confirmPassword"
              type="text"
              name="confirm-password"
              autocomplete="off"
              label="Password Confirmation"
              place-holder="Placeholder"
              :is-error="isError"
              @clear-error="isError = false"
          />

          <base-button 
            :is-loading="isLoading"
            text="Log In"
          />
        </div>
      </form>

      <div class="h-6 text-center">
        <p v-if="isError" class="text-error text-sm font-medium">
          {{ errorMessage }}
        </p>
      </div>
    </div>
    </Transition>
  </div>
</template>

<style scoped>
@reference "../../assets/styles/main.css";

.auth-fade-enter-active {
  transition: opacity 500ms ease-in-out;
}

.auth-fade-enter-from {
  opacity: 0;
}
</style>
