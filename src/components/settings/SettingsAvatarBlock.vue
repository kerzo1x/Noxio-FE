<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  avatarUrl: string | null
  initials: string
  size?: 'profile' | 'workspace'
  disabled?: boolean
}>()

const emit = defineEmits<{
  changeImage: [file: File]
  removeImage: []
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

function openFilePicker() {
  fileInputRef.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    emit('changeImage', file)
  }
  input.value = ''
}
</script>

<template>
  <div class="settings-avatar-block">
    <div
      class="settings-avatar-block__avatar"
      :class="{
        'settings-avatar-block__avatar--workspace': size === 'workspace',
      }"
    >
      <img
        v-if="avatarUrl"
        :src="avatarUrl"
        alt=""
        class="settings-avatar-block__img"
      />
      <span v-else class="settings-avatar-block__initials">{{ initials }}</span>
    </div>

    <div class="settings-avatar-block__actions">
      <input
        ref="fileInputRef"
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        class="sr-only"
        :disabled="disabled"
        @change="onFileChange"
      />
      <button
        type="button"
        class="settings-btn settings-btn--primary settings-btn--compact"
        :disabled="disabled"
        @click="openFilePicker"
      >
        Change image
      </button>
      <button
        type="button"
        class="settings-btn settings-btn--outline settings-btn--compact"
        :disabled="disabled || !avatarUrl"
        @click="emit('removeImage')"
      >
        Remove image
      </button>
      <p class="settings-avatar-block__hint">we support PNGs, JPEGs</p>
    </div>
  </div>
</template>
