<script setup lang="ts">
defineProps<{
  ariaLabelledby?: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <div
      class="popup-overlay"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="ariaLabelledby"
    >
      <div
        class="popup-backdrop"
        aria-hidden="true"
        @click="emit('close')"
      />
      <div class="relative z-1" @click.stop>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
