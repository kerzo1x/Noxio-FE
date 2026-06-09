<script setup lang="ts">
defineProps<{
  title: string
  description: string
  isError: boolean
}>()

const emit = defineEmits<{
  'update:title': [value: string]
  'update:description': [value: string]
  clearError: []
}>()
</script>

<template>
  <div class="task-popup-fields">
    <input
      :value="title"
      type="text"
      name="task-title"
      placeholder="Task name"
      class="task-popup-field"
      :class="{ 'task-popup-field--error': isError }"
      autocomplete="off"
      @input="emit('update:title', ($event.target as HTMLInputElement).value); emit('clearError')"
    />

    <textarea
      :value="description"
      name="task-description"
      placeholder="description"
      class="task-popup-field task-popup-field--textarea"
      @input="emit('update:description', ($event.target as HTMLTextAreaElement).value)"
    />
  </div>
</template>
