<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import homeIcon from '@/assets/img/home.svg'
import noxioIcon from '@/assets/img/noxioai.svg'
import settingsIcon from '@/assets/img/settings.svg'

const topNav = [
  { label: 'Home', icon: homeIcon, routeName: 'DashboardHome' },
  { label: 'Noxio AI', icon: noxioIcon, routeName: 'DashboardNoxioAi' },
  { label: 'Settings', icon: settingsIcon, routeName: 'DashboardSettings' },
]

const route = useRoute()
const router = useRouter()

const handleClick = (item: (typeof topNav)[number]) => {
  if (!item.routeName) return
  router.push({ name: item.routeName })
}

const isActive = (item: (typeof topNav)[number]) =>
  item.routeName != null && route.name === item.routeName
</script>

<template>
  <!-- TODO: preco je tu div a robi to co button?? toto treba urcite zmenit na button alebo rovno pouzi RouterLink -->
  <div
    v-for="item in topNav"
    :key="item.label"
    class="sidebar-link px-3 py-2"
    :class="{ active: isActive(item) }"
    @click="handleClick(item)"
  >
    <img :src="item.icon" :alt="item.label" class="sidebar-icon" />
    <span>{{ item.label }}</span>
  </div>
</template>
