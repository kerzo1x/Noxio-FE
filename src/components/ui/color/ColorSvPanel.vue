<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSvPanelDrag } from '@/composables/useColorPickerDrag'

const props = defineProps<{
  hue: number
  saturation: number
  value: number
  displayHex: string
}>()

const emit = defineEmits<{
  change: [saturation: number, value: number]
}>()

const svPanelRef = ref<HTMLElement | null>(null)

const { onPointerDown, onPointerMove, onPointerUp } = useSvPanelDrag(
  () => svPanelRef.value,
  (sat, val) => emit('change', sat, val),
)

const svThumbStyle = computed(() => ({
  left: `${props.saturation * 100}%`,
  top: `${(1 - props.value) * 100}%`,
  backgroundColor: props.displayHex,
}))
</script>

<template>
  <div
    ref="svPanelRef"
    class="color-picker-sv"
    :style="{ '--hue': hue }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div class="color-picker-sv-thumb" :style="svThumbStyle">
      <span class="color-picker-sv-thumb-ring" />
    </div>
  </div>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.color-picker-sv {
  @apply relative size-[174px] shrink-0 cursor-pointer touch-none overflow-hidden rounded-[4px];
  background-color: hsl(calc(var(--hue) * 1deg), 100%, 50%);
  background-image:
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, rgb(255 255 255 / 0));
}

.color-picker-sv-thumb {
  @apply pointer-events-none absolute z-10 size-2.5 -translate-x-1/2 -translate-y-1/2;
}

.color-picker-sv-thumb-ring {
  @apply absolute inset-0 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)];
}
</style>
