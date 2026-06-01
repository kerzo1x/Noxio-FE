<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  clamp,
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

const svPanelRef = ref<HTMLElement | null>(null)
const hueTrackRef = ref<HTMLElement | null>(null)

const draggingSv = ref(false)
const draggingHue = ref(false)

const hexField = ref('')
const rField = ref('')
const gField = ref('')
const bField = ref('')

function syncHsvFromHex(hex: string) {
  const rgb = hexToRgb(hex)
  if (!rgb) return
  const { h, s, v } = rgbToHsv(rgb.r, rgb.g, rgb.b)
  pickHue.value = h
  pickSat.value = s
  pickVal.value = v
}

function syncInputFieldsFromHex() {
  const rgb = hexToRgb(colorHex.value)
  if (!rgb) return
  hexField.value = colorHex.value.toUpperCase()
  rField.value = String(rgb.r)
  gField.value = String(rgb.g)
  bField.value = String(rgb.b)
}

function applyHsvToHex() {
  const { r, g, b } = hsvToRgb(pickHue.value, pickSat.value, pickVal.value)
  colorHex.value = rgbToHex(r, g, b)
  syncInputFieldsFromHex()
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
    syncInputFieldsFromHex()
  },
  { immediate: true },
)

const displayHex = computed(() => colorHex.value.toUpperCase())

const previewColorStyle = computed(() => ({
  backgroundColor: displayHex.value,
}))

const svThumbStyle = computed(() => ({
  left: `${pickSat.value * 100}%`,
  top: `${(1 - pickVal.value) * 100}%`,
  backgroundColor: displayHex.value,
}))

const hueThumbStyle = computed(() => ({
  left: `${(pickHue.value / 360) * 100}%`,
  backgroundColor: `hsl(${pickHue.value}, 100%, 50%)`,
}))

function setSvFromClient(clientX: number, clientY: number) {
  const el = svPanelRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  pickSat.value = clamp((clientX - rect.left) / rect.width, 0, 1)
  pickVal.value = clamp(1 - (clientY - rect.top) / rect.height, 0, 1)
  applyHsvToHex()
}

function setHueFromClient(clientX: number) {
  const el = hueTrackRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  pickHue.value = clamp(((clientX - rect.left) / rect.width) * 360, 0, 359.999)
  applyHsvToHex()
}

function onSvPointerDown(e: PointerEvent) {
  e.preventDefault()
  e.stopPropagation()
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  draggingSv.value = true
  setSvFromClient(e.clientX, e.clientY)
}

function onSvPointerMove(e: PointerEvent) {
  if (!draggingSv.value) return
  setSvFromClient(e.clientX, e.clientY)
}

function onSvPointerUp(e: PointerEvent) {
  if (draggingSv.value) {
    draggingSv.value = false
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }
}

function onHuePointerDown(e: PointerEvent) {
  e.preventDefault()
  e.stopPropagation()
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  draggingHue.value = true
  setHueFromClient(e.clientX)
}

function onHuePointerMove(e: PointerEvent) {
  if (!draggingHue.value) return
  setHueFromClient(e.clientX)
}

function onHuePointerUp(e: PointerEvent) {
  if (draggingHue.value) {
    draggingHue.value = false
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }
}

function parseHexInput(raw: string): boolean {
  let h = raw.trim().replace(/^#/, '')
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) return false
  colorHex.value = `#${h.toUpperCase()}`
  syncHsvFromHex(colorHex.value)
  syncInputFieldsFromHex()
  return true
}

function onHexFieldChange() {
  parseHexInput(hexField.value)
}

function onRgbFieldCommit() {
  const r = clamp(Number.parseInt(rField.value, 10) || 0, 0, 255)
  const g = clamp(Number.parseInt(gField.value, 10) || 0, 0, 255)
  const b = clamp(Number.parseInt(bField.value, 10) || 0, 0, 255)
  colorHex.value = rgbToHex(r, g, b)
  syncHsvFromHex(colorHex.value)
  syncInputFieldsFromHex()
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
      syncInputFieldsFromHex()
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
    <div
      ref="svPanelRef"
      class="color-picker-sv"
      :style="{ '--hue': pickHue }"
      @pointerdown="onSvPointerDown"
      @pointermove="onSvPointerMove"
      @pointerup="onSvPointerUp"
      @pointercancel="onSvPointerUp"
    >
      <div class="color-picker-sv-thumb" :style="svThumbStyle">
        <span class="color-picker-sv-thumb-ring" />
      </div>
    </div>

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
        <div
          ref="hueTrackRef"
          class="color-picker-slider color-picker-slider--hue"
          @pointerdown="onHuePointerDown"
          @pointermove="onHuePointerMove"
          @pointerup="onHuePointerUp"
          @pointercancel="onHuePointerUp"
        >
          <div class="color-picker-slider-thumb" :style="hueThumbStyle" />
        </div>
      </div>
    </div>

    <div class="color-picker-inputs">
      <label class="color-picker-field color-picker-field--hex">
        <span class="color-picker-field-label">HEX</span>
        <input
          v-model="hexField"
          type="text"
          class="color-picker-field-input"
          maxlength="7"
          spellcheck="false"
          @change="onHexFieldChange"
        />
      </label>

      <div class="color-picker-rgb">
        <label class="color-picker-field">
          <span class="color-picker-field-label">R</span>
          <input
            v-model="rField"
            type="text"
            inputmode="numeric"
            class="color-picker-field-input"
            maxlength="3"
            @change="onRgbFieldCommit"
          />
        </label>
        <label class="color-picker-field">
          <span class="color-picker-field-label">G</span>
          <input
            v-model="gField"
            type="text"
            inputmode="numeric"
            class="color-picker-field-input"
            maxlength="3"
            @change="onRgbFieldCommit"
          />
        </label>
        <label class="color-picker-field">
          <span class="color-picker-field-label">B</span>
          <input
            v-model="bField"
            type="text"
            inputmode="numeric"
            class="color-picker-field-input color-picker-field-input--last"
            maxlength="3"
            @change="onRgbFieldCommit"
          />
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.color-picker-panel {
  @apply z-30 flex w-[189px] flex-col items-center gap-2 rounded-[4px] bg-[#1c1b1b] p-2;
  box-shadow: 0 0 12.5px rgba(0, 0, 0, 0.12);
}

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

.color-picker-inputs {
  @apply flex w-full shrink-0 items-center justify-center gap-2;
}

.color-picker-field {
  @apply flex min-w-0 flex-col gap-1;
}

.color-picker-field--hex {
  @apply w-[59px];
}

.color-picker-rgb {
  @apply flex gap-px;
}

.color-picker-rgb .color-picker-field {
  @apply w-[35px];
}

.color-picker-field-label {
  @apply text-[8px] font-medium leading-none text-[#fafafa];
}

.color-picker-field-input {
  @apply box-border w-full rounded-[4px] border-0 bg-[#454545] px-2 py-1 text-[10px] font-normal leading-5 tracking-wide text-[#fafafa] outline-none focus:ring-1 focus:ring-white/20;
}

.color-picker-rgb .color-picker-field:first-child .color-picker-field-input {
  @apply rounded-l-[4px] rounded-r-none;
}

.color-picker-rgb .color-picker-field:nth-child(2) .color-picker-field-input {
  @apply rounded-none;
}

.color-picker-field-input--last {
  @apply rounded-l-none rounded-r-[4px];
}
</style>
