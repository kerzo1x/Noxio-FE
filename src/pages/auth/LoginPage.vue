<script setup lang="ts">
import { ref } from 'vue'
import router from '@/router' // TODO: preco importujes priamo router? ja by som tam dal import { useRouter } from 'vue-router' a const router = useRouter()
import { RouterLink } from 'vue-router'
import BaseInput from '@/components/ui/inputs/BaseInput.vue'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import AuthFormLayout from '@/components/auth/AuthFormLayout.vue'
import GoogleAuthButton from '@/components/auth/GoogleAuthButton.vue'
import FormMessage from '@/components/ui/FormMessage.vue'
import { login } from '@/api/auth'
import { persistAuthTokensFromEnvelope } from '@/utils/authTokens'
import { savePendingVerifyEmail } from '@/utils/authVerifySession'

const isLoading = ref(false)
const email = ref('')
const password = ref('')
const message = ref('')
const isError = ref(false)

function clearError() {
  isError.value = false
  message.value = ''
}

const handleLogin = async () => {
  if (!email.value || !password.value) {
    message.value = 'Please fill in all fields.'
    isError.value = true
    return
  }

  isLoading.value = true
  message.value = ''
  isError.value = false

  try {
    const { data: result } = await login(email.value, password.value)

    if (result.success) {
      if (result.data.requires2fa === false && result.data.accessToken) {
        persistAuthTokensFromEnvelope(result as unknown as Record<string, unknown>) // TODO: preco tu je unknown?? to je doslova ze obchadzanie typescriptu a pouzivas typescript :D
        isError.value = false
        message.value = result.message ?? ''
        setTimeout(() => router.push({ name: 'DashboardLayout' }), 1500)
      } else if (result.data.requires2fa === true && result.data.sessionToken) {
        localStorage.setItem('session_token', result.data.sessionToken)
        savePendingVerifyEmail(email.value)
        isError.value = false
        message.value = result.message ?? ''
        setTimeout(
          () => router.push({ name: 'Verify', query: { from: 'login' } }),
          1500,
        )
      }
    } else {
      isError.value = true
      message.value = result.message || 'Login failed.'
    }
  } catch {
    isError.value = true
    message.value = 'Network error. Please check your connection.'
  } finally {
    isLoading.value = false
  }
}

const prefill = () => { // TODO: toto by som tu kludne nehal, ale ide o to, ze tu chyba nejake overenie enviromentu, lebo na produkciu toto urcize nemoze ist. Cize sprav si nejaky napr. NODE_ENV a ked bude 'local', tak ti to moze aj rovno prefillnut tie data do inputov a inak to bude zablokovane
  email.value = 'myronsnikers@gmail.com';
  password.value = 'password1234';
  handleLogin()
}

function handleForgotPasswordClick() {
  router.push('/auth/forgot-password')
}
</script>

<template>
  <AuthFormLayout>
    <template #title>
      <h1 class="text-4xl font-bold text-panel-text">Log In</h1>
      <span
        class="absolute top-2 left-2 block h-3 w-3 cursor-pointer opacity-0"
        @click="prefill"
      />
    </template>

    <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
      <div class="flex flex-col gap-4">
        <!-- TODO: preco tu je type username? mal by byt email ... a tiez type username neexistuje v HTMLku-->
        <base-input
          v-model="email"
          type="username"
          label="Email"
          name="email"
          place-holder="your@email.com"
          autocomplete="email"
          :is-error="isError"
          @clear-error="clearError"
        />
        <base-input
          v-model="password"
          name="password"
          type="password"
          autocomplete="current-password"
          label="Password"
          place-holder="password"
          :is-error="isError"
          @clear-error="clearError"
        />
      </div>

      <div class="flex justify-end">
        <button
          type="button"
          class="text-sm text-panel-label hover:text-panel-text transition-colors duration-200 cursor-pointer"
          @click="handleForgotPasswordClick"
        >
          Forgot Password?
        </button>
      </div>

      <base-button :is-loading="isLoading" text="Log in" />
    </form>

    <template #footer>
      <div class="text-center text-sm text-panel-label tracking-wider">or</div>

      <GoogleAuthButton label="Log in with Google" @click="() => {}" />

      <p class="text-center text-sm">
        <span class="text-panel-label">Don't have an account? </span>
        <router-link
          to="/auth/register"
          class="text-panel-text font-semibold hover:underline transition-all"
        >
          Sign up
        </router-link>
      </p>

      <FormMessage :message="message" :is-error="isError" />
    </template>
  </AuthFormLayout>
</template>
