<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'default' | 'todoList'
  }>(),
  { variant: 'default' },
)
</script>

<template>
  <div
    class="pointer-events-none sticky bottom-0 z-[1] w-full bg-black"
    :class="
      variant === 'todoList'
        ? 'h-[2px] shadow-[0_-3px_10px_-1px_rgba(0,0,0,0.35)]'
        : 'dashboard-bottom-fade h-0.5'
    "
    aria-hidden="true"
  />
</template>
