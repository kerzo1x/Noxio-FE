<script setup lang="ts">
const name = defineModel<string>('name', { required: true })
const description = defineModel<string>('description', { required: true })

defineProps<{
  isError: boolean
}>()

const emit = defineEmits<{
  clearError: []
}>()
</script>

<template>
  <div class="flex w-full flex-col gap-5">
    <input
      v-model="name"
      type="text"
      name="folder-name"
      placeholder="Folder name"
      class="folder-popup-field"
      :class="{ 'folder-popup-field--error': isError }"
      autocomplete="off"
      @input="emit('clearError')"
    />
    <textarea
      v-model="description"
      name="folder-description"
      placeholder="Description"
      class="folder-popup-field folder-popup-field--textarea"
    />
  </div>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.folder-popup-field {
  @apply box-border w-full rounded-xl border-0 bg-neutral-800 px-6 text-sm font-medium leading-normal tracking-tight text-white outline-none transition-shadow placeholder:text-white/50 focus:ring-1 focus:ring-white/20;
  @apply h-13 py-0;
}

.folder-popup-field--textarea {
  @apply h-33 min-h-0 resize-none py-4;
}

.folder-popup-field--error {
  @apply ring-2 ring-red-500;
}
</style>
