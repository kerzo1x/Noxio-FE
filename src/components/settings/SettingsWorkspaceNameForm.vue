<script setup lang="ts">
import SettingsField from '@/components/settings/SettingsField.vue'

defineProps<{
  disabled: boolean
  isSaving: boolean
}>()

const name = defineModel<string>({ required: true })

const emit = defineEmits<{
  save: []
}>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <SettingsField v-model="name" label="Workspace name" :disabled="disabled" />
    <button
      v-if="!disabled"
      type="button"
      class="settings-btn settings-btn--primary settings-btn--save mt-2 self-start"
      :disabled="isSaving"
      @click="emit('save')"
    >
      {{ isSaving ? 'Saving…' : 'Save workspace name' }}
    </button>
  </div>
</template>
