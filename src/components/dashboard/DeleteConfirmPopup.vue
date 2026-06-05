<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import PopupShell from '@/components/ui/PopupShell.vue'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  titleId: string
  message: string
  errorMessage: string
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  confirm: []
  close: []
}>()

function onClose() {
  emit('close')
  open.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) onClose()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <PopupShell
    v-if="open"
    :aria-labelledby="titleId"
    @close="onClose"
  >
    <div class="delete-popup-card">
      <p :id="titleId" class="delete-popup-message">
        {{ message }}
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
          @click="emit('confirm')"
        >
          {{ isSubmitting ? 'Loading...' : 'Delete' }}
        </button>
      </div>

      <p v-if="errorMessage" class="delete-popup-error">{{ errorMessage }}</p>
    </div>
  </PopupShell>
</template>
