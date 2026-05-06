<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type AuthViewMode = 'login' | 'register'

const props = withDefaults(defineProps<{ mode?: AuthViewMode }>(), {
  mode: 'login'
})

const PREVIOUS_AUTH_VIEW_KEY = 'previous_auth_view'
const BASE_SCALE = 1.32
const currentRotation = ref(0)
const targetRotation = computed(() => (props.mode === 'register' ? 15 : 0))

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
</script>

<template>
  <div class="hidden lg:flex lg:w-1/2 max-h-screen overflow-hidden bg-surface">
    <img
      src="@/assets/img/auth-side-banner.svg"
      alt="Auth banner"
      class="h-full w-full origin-center object-cover transition-transform duration-800 ease-in-out"
      :style="{ transform: `scale(${BASE_SCALE}) rotate(${currentRotation}deg)` }"
    />
  </div>
</template>
