<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const items = [
  { label: 'Profile', name: 'SettingsProfile' },
  { label: 'Account security', name: 'SettingsSecurity' },
  { label: 'Workspace settings', name: 'SettingsWorkspace' },
  { label: 'Edupage settings', name: 'SettingsEdupage' },
] as const

const activeName = computed(() => route.name)

function goTo(name: string) {
  router.push({ name })
}
</script>

<template>
  <nav class="settings-nav" aria-label="Settings sections">
    <button
      v-for="item in items"
      :key="item.name"
      type="button"
      class="settings-nav__link"
      :class="{ 'settings-nav__link--active': activeName === item.name }"
      @click="goTo(item.name)"
    >
      {{ item.label }}
    </button>
  </nav>
</template>
