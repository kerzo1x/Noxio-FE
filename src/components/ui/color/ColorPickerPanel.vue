<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ColorHueSlider from '@/components/ui/color/ColorHueSlider.vue'
import ColorRgbFields from '@/components/ui/color/ColorRgbFields.vue'
import ColorSvPanel from '@/components/ui/color/ColorSvPanel.vue'
import {
  hexToRgb,
  hsvToRgb,
  normalizeHex,
  rgbToHex,
  rgbToHsv,
} from '@/utils/colorUtils'

const colorHex = defineModel<string>({ required: true })

const pickHue = ref(0)
const pickSat = ref(1)
const pickVal = ref(1)
const rgbFieldsRef = ref<InstanceType<typeof ColorRgbFields> | null>(null)

function syncHsvFromHex(hex: string) {
  const rgb = hexToRgb(hex)
  if (!rgb) return
  const { h, s, v } = rgbToHsv(rgb.r, rgb.g, rgb.b)
  pickHue.value = h
  pickSat.value = s
  pickVal.value = v
}

function syncInputFieldsFromHex() {
  rgbFieldsRef.value?.syncFieldsFromHex(colorHex.value)
}

function applyHsvToHex() {
  const { r, g, b } = hsvToRgb(pickHue.value, pickSat.value, pickVal.value)
  colorHex.value = rgbToHex(r, g, b)
}

watch(
  colorHex,
  (hex) => {
    const normalized = normalizeHex(hex, colorHex.value)
    if (normalized !== hex) {
      colorHex.value = normalized
      return
    }
    syncHsvFromHex(normalized)
  },
  { immediate: true },
)

const displayHex = computed(() => colorHex.value.toUpperCase())
const previewColorStyle = computed(() => ({ backgroundColor: displayHex.value }))

function onSvChange(sat: number, val: number) {
  pickSat.value = sat
  pickVal.value = val
  applyHsvToHex()
}

function onHueChange(hue: number) {
  pickHue.value = hue
  applyHsvToHex()
}

async function pickWithEyedropper() {
  if (!('EyeDropper' in window)) return
  try {
    const dropper = new (
      window as Window & {
        EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> }
      }
    ).EyeDropper()
    const result = await dropper.open()
    if (result?.sRGBHex) {
      colorHex.value = normalizeHex(result.sRGBHex, colorHex.value)
      syncHsvFromHex(colorHex.value)
    }
  } catch {
    /* cancelled */
  }
}

defineExpose({ syncHsvFromHex, syncInputFieldsFromHex })
</script>

<template>
  <div
    class="color-picker-panel"
    role="dialog"
    aria-label="Color picker"
    @click.stop
  >
    <ColorSvPanel
      :hue="pickHue"
      :saturation="pickSat"
      :value="pickVal"
      :display-hex="displayHex"
      @change="onSvChange"
    />

    <div class="color-picker-controls">
      <button
        type="button"
        class="color-picker-preview"
        aria-label="Pick color from screen"
        @click="pickWithEyedropper"
      >
        <span class="color-picker-preview-fill" :style="previewColorStyle" />
      </button>

      <div class="color-picker-sliders">
        <ColorHueSlider :hue="pickHue" @change="onHueChange" />
      </div>
    </div>

    <ColorRgbFields ref="rgbFieldsRef" v-model="colorHex" />
  </div>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.color-picker-panel {
  @apply z-30 flex w-[189px] flex-col items-center gap-2 rounded-[4px] bg-[#1c1b1b] p-2;
  box-shadow: 0 0 12.5px rgba(0, 0, 0, 0.12);
}

.color-picker-controls {
  @apply flex w-[173px] shrink-0 items-center justify-between;
}

.color-picker-preview {
  @apply relative size-7 shrink-0 cursor-pointer overflow-hidden rounded-[4px] border-0 p-0;
}

.color-picker-preview-fill {
  @apply absolute inset-0 block rounded-[4px];
}

.color-picker-sliders {
  @apply flex h-7 w-[138px] items-center;
}
</style>
