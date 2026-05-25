<script setup lang="ts">
import { ref } from 'vue'
import router from '@/router'
import BaseInput from '@/components/ui/inputs/BaseInput.vue'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import AuthBannerComponent from '@/components/auth/AuthBannerComponent.vue'
import { register } from '@/api/auth'
import { savePendingVerifyEmail } from '@/utils/authVerifySession'

const isLoading = ref(false)
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const message = ref('')
const isError = ref(false)

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
      if (result.data && result.data.sessionToken) {
        localStorage.setItem('session_token', result.data.sessionToken);
      }

      savePendingVerifyEmail(email.value)
      isError.value = false;
      isLoading.value = true
      message.value = result.message || 'Verification code sent!';

      setTimeout(() => router.push({path: '/auth/verify', query: {from: "register"} }), 1000);
    } else {
      isError.value = true;
      message.value = result.message || result.error || 'Registration failed';
    }
  } catch (error) {
    console.error('Registration error:', error);
    isError.value = true;
    message.value = 'System offline. Check your connection.';
  } finally {
    isLoading.value = false;
  }
}

const handleGoogleLogin = () => {
  // TODO: implement Google OAuth
}

</script>

<template>
  <div class="min-h-screen flex bg-surface text-text-main">

    <AuthBannerComponent mode="register" />

    <!-- Right dark panel -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-10 bg-panel-bg">
      <Transition name="auth-fade" appear>
      <div class="auth-form-panel w-full max-w-md space-y-6">

        <h1 class="text-4xl font-bold text-panel-text">Sign Up</h1>

        <form @submit.prevent="handleRegister" class="space-y-4">

          <div class="flex flex-col gap-4">
            <div class="flex gap-4">
            <base-input
              v-model="firstName"
              type="text"
              name="firstName"
              autocomplete="off"
              label="Name"
              place-holder="Placeholder"
              :is-error="isError"
              @clear-error="isError = false; message=''"
            />
              <base-input
                v-model="lastName"
                type="text"
                name="lastName"
                autocomplete="off"
                label="Surname"
                place-holder="Placeholder"
                :is-error="isError"
                @clear-error="isError = false; message=''"
              />
            </div>
            <base-input
              v-model="email"
              type="text"
              name="email"
              autocomplete="off"
              label="Email"
              place-holder="Placeholder"
              :is-error="isError"
              @clear-error="isError = false; message=''"
            />
            <base-input
              v-model="password"
              type="text"
              name="password"
              autocomplete="off"
              label="Password"
              place-holder="Placeholder"
              :is-error="isError"
              @clear-error="isError = false; message=''"
            />
          </div>

          

          <base-button 
              :is-loading="isLoading"
              text="Sign up"
          />
        </form>

        <div class="text-center text-sm text-panel-label tracking-wider">or</div>
        <button type="button" class="google-btn" @click="handleGoogleLogin">
          <img src="../../assets/img/google.png" class="w-5 h-5" alt="Google" />
          Sign up with Google
        </button>

        <p class="text-center text-sm">
          <span class="text-panel-label">Already have an account? </span>
          <router-link to="/auth/login" class="text-panel-text font-semibold hover:underline transition-all">
            Log in
          </router-link>
        </p>

        <div class="h-6 flex items-center justify-center mt-2">
          <p v-show="message" class="text-sm font-medium transition-opacity duration-300"
            :class="isError ? 'text-error' : 'text-green-400'">
            {{ message }}
          </p>
        </div>

      </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
@reference "../../assets/styles/main.css";

.google-btn {
  @apply w-full flex items-center justify-center gap-3 px-4 py-3 rounded-auth font-semibold text-panel-text border border-panel-input-border hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer;
}

.auth-form-panel {
  transition: opacity 850ms ease-in-out, transform 850ms ease-in-out;
}

.auth-fade-enter-active {
  transition: opacity 500ms ease-in-out;
}

.auth-fade-enter-from {
  opacity: 0;
}
</style>
