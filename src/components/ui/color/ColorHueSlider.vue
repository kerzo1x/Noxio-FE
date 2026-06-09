<script setup lang="ts">
import { computed, ref } from 'vue'
import { useHueSliderDrag } from '@/composables/useColorPickerDrag'

const props = defineProps<{
  hue: number
}>()

const emit = defineEmits<{
  change: [hue: number]
}>()

const hueTrackRef = ref<HTMLElement | null>(null)

const { onPointerDown, onPointerMove, onPointerUp } = useHueSliderDrag(
  () => hueTrackRef.value,
  (hue) => emit('change', hue),
)

const hueThumbStyle = computed(() => ({
  left: `${(props.hue / 360) * 100}%`,
  backgroundColor: `hsl(${props.hue}, 100%, 50%)`,
}))
</script>

<template>
  <div
    ref="hueTrackRef"
    class="color-picker-slider color-picker-slider--hue"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div class="color-picker-slider-thumb" :style="hueThumbStyle" />
  </div>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.color-picker-slider {
  @apply relative h-2.5 w-full shrink-0 cursor-pointer touch-none rounded-full;
}

.color-picker-slider--hue {
  background: linear-gradient(
    to right,
    #f00 0%,
    #ff0 17%,
    #0f0 33%,
    #0ff 50%,
    #00f 67%,
    #f0f 83%,
    #f00 100%
  );
}

.color-picker-slider-thumb {
  @apply pointer-events-none absolute top-1/2 z-10 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.2)];
}
</style>
