<script setup lang="ts">
import logoIcon from '@/assets/img/logo.svg'
</script>

<template>
  <router-link
    :to="{ name: 'DashboardHome' }"
    class="block shrink-0 leading-none"
    aria-label="Home"
  >
    <img :src="logoIcon" alt="" class="block h-auto w-auto max-h-full" />
  </router-link>
</template>
