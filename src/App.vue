<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const currentRouteName = computed(() => String(route.name ?? ''))
const isAuthSwitchRoute = computed(
  () => currentRouteName.value === 'Login' || currentRouteName.value === 'Register'
)
const transitionName = computed(() => (isAuthSwitchRoute.value ? 'auth-switch' : ''))
const routeKey = computed(() => {
  if (isAuthSwitchRoute.value) return route.fullPath
  if (currentRouteName.value.startsWith('Dashboard')) return 'dashboard'
  return route.fullPath
})
</script>

<template>
  <router-view v-slot="{ Component, route: currentRoute }">
    <transition :name="transitionName" mode="out-in">
      <component :is="Component" :key="routeKey" />
    </transition>
  </router-view>
</template>

<style>
.auth-switch-enter-active .auth-form-panel,
.auth-switch-leave-active .auth-form-panel {
  transition: opacity 800ms ease-in-out;
}

.auth-switch-enter-from .auth-form-panel,
.auth-switch-leave-to .auth-form-panel {
  opacity: 0;
}
</style>
