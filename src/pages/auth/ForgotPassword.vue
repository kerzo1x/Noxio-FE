<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseInput from '@/components/ui/inputs/BaseInput.vue'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import { forgotPassword } from '@/api/auth'
import { savePendingVerifyEmail } from '@/utils/authVerifySession'

const router = useRouter()
const email = ref('')
const isError = ref(false)
const isLoading = ref(false)

const handleSendCode = async () => {
  if (!email.value) {
    isError.value = true
    return
  }
  
  isLoading.value = true
  isError.value = false

  try {
    const { data: result } = await forgotPassword(email.value)

    if (result.success) {
      if (result.data && result.data.sessionToken) {
        localStorage.setItem('session_token', result.data.sessionToken)
        savePendingVerifyEmail(email.value)
      }

      router.push({ 
        path: '/auth/verify',
        query: {from: "forgot"}
      })
    } else {
      isError.value = true
    }
  } catch (error) {
    console.error('Forgot password error:', error)
    isError.value = true
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-brand-black font-sans">
    <Transition name="auth-fade" appear>
    <div class="forgot-form-shell w-full max-w-sm text-center space-y-8">
      
      <div class="space-y-2 max-w-xs mx-auto text-center">
        <h1 class="text-4xl font-bold text-brand-white">Forgot password</h1>
        <p class="text-panel-label text-sm leading-relaxed">
          Use your email to reset password
        </p>
      </div>

      <form @submit.prevent="handleSendCode" class="space-y-6 text-left">
        <div class="space-y-2">
          <base-input
            v-model="email"
            type="text"
            name="email"
            autocomplete="off"
            label="Email"
            place-holder="tomas.lukacko@gmail.com"
            :is-error="isError"
            @clear-error="isError = false"
          />
      </div>

        <base-button 
          :is-loading="isLoading"
          text="Send reset code"
        />
      </form>

      <div class="h-6">
        <p v-if="isError" class="text-error text-sm font-medium">
          Something went wrong.
        </p>
      </div>
    </div>
    </Transition>
  </div>
</template>

<style scoped>
@reference "../../assets/styles/main.css";

.forgot-form-shell {
  transition: opacity 500ms ease-in-out;
}

.auth-fade-enter-active {
  transition: opacity 500ms ease-in-out;
}

.auth-fade-enter-from {
  opacity: 0;
}

.btn-primary {
  @apply bg-brand-white text-brand-black py-3 rounded-auth font-semibold
         hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]
         transition-all duration-200 disabled:opacity-50 cursor-pointer;
}
</style>
