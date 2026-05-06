<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

type AuthViewMode = 'login' | 'register'

const props = withDefaults(
  defineProps<{ mode?: AuthViewMode; forgotAnimating?: boolean }>(),
  {
    mode: 'login',
    forgotAnimating: false
  }
)

const PREVIOUS_AUTH_VIEW_KEY = 'previous_auth_view'
const BASE_SCALE = 1.32
const currentRotation = ref(0)
const targetRotation = computed(() => (props.mode === 'register' ? 15 : 0))
const flippedGradientOpacity = ref(0)

onMounted(() => {
  const previousMode = sessionStorage.getItem(PREVIOUS_AUTH_VIEW_KEY) as AuthViewMode | null
  const isAuthSwitch =
    previousMode !== null &&
    (previousMode === 'login' || previousMode === 'register') &&
    previousMode !== props.mode

  sessionStorage.setItem(PREVIOUS_AUTH_VIEW_KEY, props.mode)

  if (!isAuthSwitch) {
    currentRotation.value = targetRotation.value
    return
  }

  currentRotation.value = previousMode === 'register' ? 15 : 0
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      currentRotation.value = targetRotation.value
    })
  })
})

watch(
  () => props.forgotAnimating,
  (isAnimating) => {
    flippedGradientOpacity.value = isAnimating ? 1 : 0
  }
)
</script>

<template>
  <div class="hidden lg:flex lg:w-1/2 max-h-screen overflow-hidden bg-surface">
    <svg
      viewBox="0 0 911 1187"
      xmlns="http://www.w3.org/2000/svg"
      class="h-full w-full origin-center transition-transform duration-700 ease-in-out"
      :style="{ transform: `scale(${BASE_SCALE}) rotate(${currentRotation}deg)` }"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="911" height="1187" fill="url(#bannerGradientDefault)" />
      <rect
        width="911"
        height="1187"
        fill="url(#bannerGradientFlipped)"
        class="transition-opacity duration-700 ease-in-out"
        :style="{ opacity: flippedGradientOpacity }"
      />
      <defs>
        <linearGradient id="bannerGradientDefault" x1="-53.9408" y1="1263.58" x2="1054.9" y2="1121.28" gradientUnits="userSpaceOnUse">
          <stop stop-color="#F9F9F9" />
          <stop offset="0.219259" stop-color="#E85102" />
          <stop offset="0.339186" stop-color="#C10801" />
          <stop offset="0.492464" stop-color="#610401" />
          <stop offset="0.638098" stop-color="#300200" />
          <stop offset="0.833015" />
        </linearGradient>
        <linearGradient id="bannerGradientFlipped" x1="-1163.78" y1="1548.18" x2="-54.9408" y2="1405.88" gradientUnits="userSpaceOnUse">
          <stop stop-color="#F9F9F9" />
          <stop offset="0.219259" stop-color="#E85102" />
          <stop offset="0.339186" stop-color="#C10801" />
          <stop offset="0.492464" stop-color="#610401" />
          <stop offset="0.638098" stop-color="#300200" />
          <stop offset="0.833015" />
        </linearGradient>
      </defs>
    </svg>
  </div>
</template>
