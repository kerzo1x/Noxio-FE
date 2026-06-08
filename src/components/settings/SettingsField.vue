<script setup lang="ts">
defineProps<{
  label: string
  readonly?: boolean
  disabled?: boolean
  type?: string
  placeholder?: string
  masked?: boolean
}>()

const model = defineModel<string>()
</script>

<template>
  <div class="settings-field">
    <label class="settings-field__label">{{ label }}</label>
    <div
      v-if="masked"
      class="settings-field__input settings-field__input--masked"
      aria-hidden="true"
    >
      <span class="settings-field__dot" />
      <span class="settings-field__dot" />
      <span class="settings-field__dot" />
      <span class="settings-field__dot" />
      <span class="settings-field__dot" />
      <span class="settings-field__dot" />
      <span class="settings-field__dot" />
      <span class="settings-field__dot" />
      <span class="settings-field__dot settings-field__dot--dim" />
    </div>
    <input
      v-else
      v-model="model"
      class="settings-field__input"
      :type="type ?? 'text'"
      :readonly="readonly"
      :disabled="disabled"
      :placeholder="placeholder"
    />
  </div>
</template>
