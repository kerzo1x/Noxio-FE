<script setup lang="ts">
const model = defineModel<boolean>({ default: false })

defineProps<{
  disabled?: boolean
}>()
</script>

<template>
  <button
    type="button"
    role="switch"
    class="settings-toggle"
    :class="{ 'settings-toggle--on': model }"
    :aria-checked="model"
    :disabled="disabled"
    @click="!disabled && (model = !model)"
  >
    <span class="settings-toggle__thumb" />
  </button>
</template>
