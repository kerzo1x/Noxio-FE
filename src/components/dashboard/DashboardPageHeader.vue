<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <header class="dashboard-page-header">
    <div class="flex items-center justify-between">
      <h1 class="dashboard-page-title">
        {{ title }}
      </h1>
      <div class="dashboard-action-slot">
        <slot name="action" />
      </div>
    </div>
  </header>
</template>
