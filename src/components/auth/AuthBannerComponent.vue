<script setup lang="ts">
import sideBanner from '@/assets/img/side-banner.svg'
</script>

<template>
  <div class="hidden lg:flex lg:w-1/2 max-h-screen overflow-hidden bg-surface">
    <img
      :src="sideBanner"
      alt=""
      class="h-full w-full object-cover object-center"
    />
  </div>
</template>
