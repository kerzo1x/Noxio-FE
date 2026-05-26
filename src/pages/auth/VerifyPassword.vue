<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AuthBannerComponent from '@/components/auth/AuthBannerComponent.vue'
import { resend2fa, verify2fa } from '@/api/auth'
import { persistAuthTokensFromEnvelope } from '@/utils/authTokens'
import { getPendingVerifyEmail } from '@/utils/authVerifySession'

const router = useRouter()
const route = useRoute()
const userEmail = ref(getPendingVerifyEmail() ?? '')
const code = ref(['', '', '', '', ''])
const inputs = ref<HTMLInputElement[]>([])
const isError = ref(false)
const isLoading = ref(false)

const timer = ref(59)
const isTimerActive = computed(() => timer.value > 0)
let intervalId: number | null = null

const startTimer = () => {
    timer.value = 2
    if (intervalId) clearInterval(intervalId)
    intervalId = window.setInterval(() => {
        if (timer.value > 0) {
            timer.value--
        } else {
            if (intervalId) clearInterval(intervalId)
        }
    }, 1000)
}

onMounted(() => {
    userEmail.value = getPendingVerifyEmail() ?? ''
    if (inputs.value[0]) inputs.value[0].focus()
    startTimer()
})

onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
})

const handleResendCode = async () => {
    if (isTimerActive.value || isLoading.value) return

    const sessionToken = localStorage.getItem('session_token')
    if (!sessionToken) return

    isLoading.value = true
    try {
        const { data: result } = await resend2fa(sessionToken)
        if (result.success) {
            isError.value = false
        }
        startTimer() 
    } catch (error) {
        console.error('Resend error:', error)
    } finally {
        isLoading.value = false
    }
}

const handleInput = (index: number, e: Event) => {
    isError.value = false
    const target = e.target as HTMLInputElement
    const value = target.value.slice(-1).toUpperCase()

    if (value && /^[A-Z0-9]$/.test(value)) {
        code.value[index] = value
        target.value = value
        if (index < 4) inputs.value[index + 1].focus()
    } else {
        code.value[index] = ''
        target.value = ''
    }
}

const handleKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === 'Backspace' && !code.value[index] && index > 0) {
        inputs.value[index - 1].focus()
    }
}

const handleVerify = async () => {
    const finalCode = code.value.join('')
    if (finalCode.length < 5 || isLoading.value) return

    const sessionToken = localStorage.getItem('session_token')
    if (!sessionToken) {
        router.push('/auth/login')
        return
    }
    isLoading.value = true
    try {
        const { data: result } = await verify2fa(sessionToken, finalCode)

        if (result.success) {
            if (result.data.sessionToken && route.query.from === "forgot") {
                localStorage.setItem('session_token', result.data.sessionToken)
                localStorage.setItem('verification_code', finalCode)
                router.push('/auth/reset-password')
            } else {
                if (result.data.accessToken) {
                    persistAuthTokensFromEnvelope(result as unknown as Record<string, unknown>)
                    localStorage.removeItem('session_token')
                    router.push(route.query.from === "register" ? '/auth/edupage' : '/dashboard')
                }
            }
        } else {
            isError.value = true                
        }
    } catch (error) {
        isError.value = true
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div class="min-h-screen flex bg-surface text-text-main font-sans">
        <AuthBannerComponent />

        <div class="w-full lg:w-1/2 flex items-center justify-center p-10 bg-panel-bg">
            <Transition name="auth-fade" appear>
            <div class="w-full max-w-sm text-center space-y-8">

                <div class="space-y-2">
                    <h1 class="text-4xl font-bold text-panel-text">Verify your email</h1>
                    <p class="text-panel-label text-sm leading-relaxed">
                        We sent a verification code to <span class="text-panel-text font-medium">{{ userEmail }}</span>.
                    </p>
                </div>

                <form @submit.prevent="handleVerify" class="space-y-8">
                    <div class="flex justify-between gap-3">
                        <input
                            v-for="(_, i) in 5"
                            :key="i"
                            :id="`verify-code-${i}`"
                            :ref="(el) => { if (el) inputs[i] = el as HTMLInputElement }"
                            v-model="code[i]"
                            type="text"
                            :name="`verification-code-${i}`"
                            inputmode="text"
                            maxlength="1"
                            autocomplete="one-time-code"
                            :aria-label="`Verification code digit ${i + 1}`"
                            class="otp-input"
                            :class="{ 'input-error': isError }"
                            @input="handleInput(i, $event)"
                            @keydown="handleKeyDown(i, $event)"
                            :disabled="isLoading"
                        />
                    </div>

                    <div class="flex gap-3">
                        <button type="button" class="btn-secondary w-24" @click="router.back()">
                            Back
                        </button>
                        <button type="submit" class="btn-primary flex-1" :disabled="isLoading">
                            {{ isLoading ? 'Verifying...' : 'Verify' }}
                        </button>
                    </div>
                </form>

                <div class="space-y-15">
                    <div class="text-sm">
                        
                        <button 
                            @click="handleResendCode" 
                            class="resend-link" 
                            :disabled="isTimerActive || isLoading"
                        >
                            {{ isTimerActive ? `Resend in ${timer}s` : 'Resend code' }}
                        </button>
                    </div>

                    <div class="h-6 flex items-center justify-center">
                        <p v-show="isError" class="text-error text-sm font-medium">
                            Invalid verification code.
                        </p>
                    </div>
                </div>

            </div>
            </Transition>
        </div>
    </div>
</template>

<style scoped>
@reference "../../assets/styles/main.css";

.otp-input {
    @apply w-full aspect-square text-center text-2xl font-bold rounded-auth outline-none bg-panel-input-bg text-panel-text transition-all duration-200;
    text-transform: uppercase;
}

.otp-input:focus {
    @apply ring-1 ring-panel-text/30;
}

.otp-input.input-error {
    @apply ring-2 ring-error text-error;
}

.btn-primary {
    @apply bg-brand-white text-brand-black py-3 rounded-auth font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer;
}

.btn-secondary {
    @apply py-3 rounded-auth font-semibold text-panel-label border border-panel-input-border hover:bg-white/5 hover:text-panel-text hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer;
}
.resend-link {
    @apply text-panel-text font-semibold transition-colors duration-200 cursor-pointer;
}

.resend-link:disabled {
    @apply text-panel-label cursor-not-allowed opacity-60;
}

.resend-link:not(:disabled):hover {
    @apply text-brand-white underline;
}

.auth-fade-enter-active {
    transition: opacity 500ms ease-in-out;
}

.auth-fade-enter-from {
    opacity: 0;
}
</style>
