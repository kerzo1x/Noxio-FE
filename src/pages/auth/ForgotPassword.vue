<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseInput from '@/components/ui/inputs/BaseInput.vue'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import { apiBaseUrl } from '@/config/api'
import { authFetch } from '@/utils/authFetch'


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
    const response = await authFetch(`${apiBaseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value })
    })
    
    const result = await response.json()

    if (result.success) {
      //saving sessionToken for verify
      if (result.data && result.data.sessionToken) {
        localStorage.setItem('session_token', result.data.sessionToken)
        localStorage.setItem('user_email', email.value)
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
            type="email"
            label="Email" 
            place-holder="Placeholder" 
            :is-error="isError"
            @clear-error="isError = false"
          />
      </div>
      <!-- TODO: normal error  -->

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