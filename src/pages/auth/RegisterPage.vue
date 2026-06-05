<script setup lang="ts">
import { ref } from 'vue'
import router from '@/router'
import { RouterLink } from 'vue-router'
import BaseInput from '@/components/ui/inputs/BaseInput.vue'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import AuthFormLayout from '@/components/auth/AuthFormLayout.vue'
import GoogleAuthButton from '@/components/auth/GoogleAuthButton.vue'
import FormMessage from '@/components/ui/FormMessage.vue'
import { register } from '@/api/auth'
import { savePendingVerifyEmail } from '@/utils/authVerifySession'

const isLoading = ref(false)
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const message = ref('')
const isError = ref(false)

function clearError() {
  isError.value = false
  message.value = ''
}

const handleRegister = async () => {
  if (!email.value || !password.value || !firstName.value || !lastName.value) {
    isError.value = true
    message.value = 'Please fill in all fields.'
    return
  }

  isLoading.value = true
  message.value = ''
  isError.value = false

  try {
    const { data: result } = await register({
      name: firstName.value,
      surname: lastName.value,
      email: email.value,
      password: password.value,
    })

    if (result.success) {
      if (result.data?.sessionToken) {
        localStorage.setItem('session_token', result.data.sessionToken)
      }
      savePendingVerifyEmail(email.value)
      isError.value = false
      message.value = result.message || 'Verification code sent!'
      setTimeout(
        () => router.push({ path: '/auth/verify', query: { from: 'register' } }),
        1000,
      )
    } else {
      isError.value = true
      message.value = result.message || result.error || 'Registration failed'
      isLoading.value = false
    }
  } catch {
    isError.value = true
    message.value = 'System offline. Check your connection.'
    isLoading.value = false
  }
}
</script>

<template>
  <AuthFormLayout>
    <template #title>
      <h1 class="text-4xl font-bold text-panel-text">Sign Up</h1>
    </template>

    <form class="flex flex-col gap-4" @submit.prevent="handleRegister">
      <div class="flex flex-col gap-4">
        <div class="flex gap-4">
          <base-input
            v-model="firstName"
            type="text"
            name="firstName"
            autocomplete="off"
            label="Name"
            place-holder="Name"
            :is-error="isError"
            @clear-error="clearError"
          />
          <base-input
            v-model="lastName"
            type="text"
            name="lastName"
            autocomplete="off"
            label="Surname"
            place-holder="Surname"
            :is-error="isError"
            @clear-error="clearError"
          />
        </div>
        <base-input
          v-model="email"
          type="text"
          name="email"
          autocomplete="off"
          label="Email"
          place-holder="your@email.com"
          :is-error="isError"
          @clear-error="clearError"
        />
        <base-input
          v-model="password"
          type="text"
          name="password"
          autocomplete="off"
          label="Password"
          place-holder="password"
          :is-error="isError"
          @clear-error="clearError"
        />
      </div>

      <base-button :is-loading="isLoading" text="Sign up" />
    </form>

    <template #footer>
      <div class="text-center text-sm text-panel-label tracking-wider">or</div>

      <GoogleAuthButton label="Sign up with Google" @click="() => {}" />

      <p class="text-center text-sm">
        <span class="text-panel-label">Already have an account? </span>
        <router-link
          to="/auth/login"
          class="text-panel-text font-semibold hover:underline transition-all"
        >
          Log in
        </router-link>
      </p>

      <FormMessage :message="message" :is-error="isError" />
    </template>
  </AuthFormLayout>
</template>
