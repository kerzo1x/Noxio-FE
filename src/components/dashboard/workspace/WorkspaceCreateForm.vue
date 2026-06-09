<script setup lang="ts">
defineProps<{
  isError: boolean
}>()

const name = defineModel<string>({ required: true })

const emit = defineEmits<{
  input: []
}>()
</script>

<template>
  <input
    id="workspace-popup-title"
    v-model="name"
    type="text"
    name="workspace-name"
    placeholder="Workspace name"
    class="workspace-popup-field"
    :class="{ 'workspace-popup-field--error': isError }"
    autocomplete="off"
    @input="emit('input')"
  />
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.workspace-popup-field {
  @apply box-border h-13 w-full rounded-xl border-0 bg-neutral-800 px-7 text-sm font-medium leading-normal tracking-tight text-white outline-none transition-shadow placeholder:text-white/50 focus:ring-1 focus:ring-white/20;
}

.workspace-popup-field--error {
  @apply ring-2 ring-red-500;
}
</style>
