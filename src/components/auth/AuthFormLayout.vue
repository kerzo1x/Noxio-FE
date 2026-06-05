<script setup lang="ts">
import AuthBannerComponent from '@/components/auth/AuthBannerComponent.vue'
</script>

<template>
  <div class="min-h-screen flex bg-surface text-text-main">
    <AuthBannerComponent />

    <div class="w-full lg:w-1/2 flex items-center justify-center p-10 bg-panel-bg">
      <div class="auth-form-panel w-full max-w-md flex flex-col gap-6">
        <slot name="title" />
        <slot />
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
