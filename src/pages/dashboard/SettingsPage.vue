<script setup lang="ts">
import SettingsNav from '@/components/settings/SettingsNav.vue'
</script>

<template>
  <section class="dashboard-page-column">
    <div
      class="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div class="settings-layout">
        <SettingsNav />
        <div class="settings-panel">
          <router-view />
        </div>
      </div>
    </div>

    <div
      class="pointer-events-none sticky bottom-0 z-[1] h-0.5 w-full bg-black dashboard-bottom-fade"
      aria-hidden="true"
    />
  </section>
</template>
