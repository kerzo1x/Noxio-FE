<script setup lang="ts">
defineProps<{
  label: string
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button type="button" class="google-btn" @click="emit('click')">
    <img src="@/assets/img/google.png" class="w-5 h-5" alt="Google" />
    {{ label }}
  </button>
</template>
