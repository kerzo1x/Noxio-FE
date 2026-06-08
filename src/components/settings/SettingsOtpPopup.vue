<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import PopupShell from '@/components/ui/PopupShell.vue'
import { resend2fa, verify2fa } from '@/api/auth'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  title: string
  sessionToken: string
  /** TODO: backend — endpoint подтверждения OTP после DELETE /auth/me */
  confirmMode?: '2fa' | 'delete-account'
}>()

const emit = defineEmits<{
  success: []
  close: []
}>()

const code = ref(['', '', '', '', ''])
const inputs = ref<HTMLInputElement[]>([])
const isError = ref(false)
const isLoading = ref(false)
const timer = ref(59)
const isTimerActive = computed(() => timer.value > 0)
let intervalId: number | null = null

function startTimer() {
  timer.value = 59
  if (intervalId) clearInterval(intervalId)
  intervalId = window.setInterval(() => {
    if (timer.value > 0) {
      timer.value--
    } else if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }, 1000)
}

function resetCode() {
  code.value = ['', '', '', '', '']
  isError.value = false
}

function onClose() {
  resetCode()
  emit('close')
  open.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) onClose()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  startTimer()
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  if (intervalId) clearInterval(intervalId)
})

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      resetCode()
      startTimer()
      nextTick(() => inputs.value[0]?.focus())
    }
  },
)

function handleInput(index: number, e: Event) {
  isError.value = false
  const target = e.target as HTMLInputElement
  const value = target.value.slice(-1).toUpperCase()

  if (value && /^[A-Z0-9]$/.test(value)) {
    code.value[index] = value
    target.value = value
    if (index < 4) inputs.value[index + 1]?.focus()
  } else {
    code.value[index] = ''
    target.value = ''
  }
}

function handleKeyDown(index: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !code.value[index] && index > 0) {
    inputs.value[index - 1]?.focus()
  }
}

async function handleResend() {
  if (isTimerActive.value || isLoading.value || !props.sessionToken) return
  isLoading.value = true
  try {
    await resend2fa(props.sessionToken)
    startTimer()
  } catch {
    isError.value = true
  } finally {
    isLoading.value = false
  }
}

async function handleVerify() {
  const finalCode = code.value.join('')
  if (finalCode.length < 5 || isLoading.value) return

  if (props.confirmMode === 'delete-account') {
    // TODO: backend — уточнить endpoint подтверждения OTP после DELETE /auth/me
    isError.value = true
    return
  }

  isLoading.value = true
  try {
    const { data: result } = await verify2fa(props.sessionToken, finalCode)
    if (result.success) {
      emit('success')
      onClose()
    } else {
      isError.value = true
    }
  } catch {
    isError.value = true
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <PopupShell v-if="open" aria-labelledby="settings-otp-title" @close="onClose">
    <div class="delete-popup-card max-w-md">
      <p id="settings-otp-title" class="delete-popup-message">
        {{ title }}
      </p>

      <p v-if="confirmMode === 'delete-account'" class="mt-4 text-center text-xs text-white/50">
        <!-- TODO: backend — endpoint подтверждения удаления аккаунта ещё не подключён -->
        Account deletion confirmation API is pending.
      </p>

      <div class="mt-8 flex justify-center gap-2">
        <input
          v-for="(_, index) in code"
          :key="index"
          :ref="(el) => { if (el) inputs[index] = el as HTMLInputElement }"
          type="text"
          maxlength="1"
          class="settings-field__input h-12 w-10 text-center uppercase"
          :class="{ 'input-error': isError }"
          :disabled="confirmMode === 'delete-account'"
          @input="handleInput(index, $event)"
          @keydown="handleKeyDown(index, $event)"
        />
      </div>

      <div class="delete-popup-actions mt-8">
        <button
          type="button"
          class="delete-popup-btn delete-popup-btn--cancel"
          @click="onClose"
        >
          Cancel
        </button>
        <button
          type="button"
          class="delete-popup-btn delete-popup-btn--cancel min-w-[120px]"
          :disabled="confirmMode === 'delete-account' || isLoading"
          @click="handleVerify"
        >
          {{ isLoading ? 'Verifying…' : 'Verify' }}
        </button>
      </div>

      <button
        type="button"
        class="mt-4 w-full border-0 bg-transparent text-center text-xs text-white/50 hover:text-white/75 disabled:opacity-40"
        :disabled="isTimerActive || isLoading || confirmMode === 'delete-account'"
        @click="handleResend"
      >
        {{
          isTimerActive
            ? `Resend code in ${timer}s`
            : 'Resend code'
        }}
      </button>

      <p v-if="isError" class="delete-popup-error">
        Invalid code. Please try again.
      </p>
    </div>
  </PopupShell>
</template>
