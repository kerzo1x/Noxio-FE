<script setup lang="ts">
defineProps<{
  message: string
  isError: boolean
}>()
</script>

<template>
  <div class="h-6 flex items-center justify-center mt-2">
    <p
      v-show="message"
      class="text-sm font-medium transition-opacity duration-300"
      :class="isError ? 'text-error' : 'text-green-400'"
    >
      {{ message }}
    </p>
  </div>
</template>
