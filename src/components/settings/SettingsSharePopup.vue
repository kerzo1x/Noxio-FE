<script setup lang="ts">
import { ref } from 'vue'
import { useEscapeKey } from '@/composables/useEscapeKey'
import PopupShell from '@/components/ui/PopupShell.vue'
import SettingsField from '@/components/settings/SettingsField.vue'
import type { WorkspaceMemberRole } from '@/composables/useWorkspaceMembers'

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  share: [payload: { email: string; role: WorkspaceMemberRole }]
  close: []
}>()

const email = ref('')
const role = ref<WorkspaceMemberRole>('EDITOR')
const isSubmitting = ref(false)
const errorMessage = ref('')

const roleOptions: { value: WorkspaceMemberRole; label: string }[] = [
  { value: 'VIEWER', label: 'Viewer' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'ADMIN', label: 'Admin' },
]

function onClose() {
  email.value = ''
  role.value = 'EDITOR'
  errorMessage.value = ''
  emit('close')
  open.value = false
}

useEscapeKey(onClose, () => open.value)

function handleShare() {
  const trimmed = email.value.trim().toLowerCase()
  if (!trimmed) {
    errorMessage.value = 'Enter a member email.'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    errorMessage.value = 'Enter a valid email address.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  emit('share', { email: trimmed, role: role.value })
  isSubmitting.value = false
  onClose()
}
</script>

<template>
  <PopupShell v-if="open" aria-labelledby="settings-share-title" @close="onClose">
    <div class="settings-share-popup">
      <SettingsField
        v-model="email"
        label="Member email"
        placeholder="Member email"
      />

      <p class="mt-8 text-sm font-medium text-white">Select role</p>
      <div class="settings-share-popup__roles">
        <button
          v-for="opt in roleOptions"
          :key="opt.value"
          type="button"
          class="settings-share-popup__role"
          :class="{
            'settings-share-popup__role--active': role === opt.value,
          }"
          @click="role = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>

      <button
        type="button"
        class="settings-btn settings-btn--share mt-10 h-12 w-full text-base"
        :disabled="isSubmitting"
        @click="handleShare"
      >
        Share
      </button>

      <p v-if="errorMessage" class="settings-message mt-4 text-center">
        {{ errorMessage }}
      </p>
    </div>
  </PopupShell>
</template>
