<script setup lang="ts">
import { ref } from 'vue'
import { useEscapeKey } from '@/composables/useEscapeKey'
import PopupShell from '@/components/ui/PopupShell.vue'
import { initiateAccountDeletion } from '@/api/user'

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  initiated: [sessionToken: string]
  close: []
}>()

const isSubmitting = ref(false)
const errorMessage = ref('')

function onClose() {
  errorMessage.value = ''
  emit('close')
  open.value = false
}

useEscapeKey(onClose, () => open.value)

async function handleConfirm() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const { data } = await initiateAccountDeletion()
    if (!data.success) {
      throw new Error(data.message || 'Failed to initiate deletion.')
    }
    const sessionToken = data.data?.sessionToken ?? ''
    if (sessionToken) {
      localStorage.setItem('session_token', sessionToken)
    }
    emit('initiated', sessionToken)
    onClose()
  } catch (err) {
    errorMessage.value =
      err instanceof Error ? err.message : 'Failed to initiate deletion.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <PopupShell
    v-if="open"
    aria-labelledby="settings-delete-title"
    @close="onClose"
  >
    <div class="delete-popup-card">
      <p id="settings-delete-title" class="delete-popup-message">
        Delete all my data and account? A confirmation code will be sent to your
        email.
      </p>

      <div class="delete-popup-actions">
        <button
          type="button"
          class="delete-popup-btn delete-popup-btn--cancel"
          @click="onClose"
        >
          Cancel
        </button>
        <button
          type="button"
          class="delete-popup-btn delete-popup-btn--delete"
          :disabled="isSubmitting"
          @click="handleConfirm"
        >
          {{ isSubmitting ? 'Loading…' : 'Delete my account' }}
        </button>
      </div>

      <p v-if="errorMessage" class="delete-popup-error">{{ errorMessage }}</p>
    </div>
  </PopupShell>
</template>
