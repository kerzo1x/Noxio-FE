<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const currentRouteName = computed(() => String(route.name ?? ''))
const isAuthSwitchRoute = computed(
  () => currentRouteName.value === 'Login' || currentRouteName.value === 'Register'
)
const routeKey = computed(() => {
  if (isAuthSwitchRoute.value) return route.fullPath
  if (currentRouteName.value.startsWith('Dashboard')) return 'dashboard'
  return route.fullPath
})
</script>

<template>
  <router-view v-slot="{ Component }">
    <component :is="Component" :key="routeKey" />
  </router-view>
</template>
