<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const transitionName = computed(() => {
  const currentRouteName = String(route.name ?? '')
  const isAuthSwitchRoute = currentRouteName === 'Login' || currentRouteName === 'Register'
  return isAuthSwitchRoute ? 'auth-switch' : ''
})
</script>

<template>
  <router-view v-slot="{ Component, route: currentRoute }">
    <transition :name="transitionName" mode="out-in">
      <component :is="Component" :key="currentRoute.fullPath" />
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
