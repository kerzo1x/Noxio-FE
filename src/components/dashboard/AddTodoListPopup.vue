<script setup lang="ts">
import {
  computed,
  ref,
  watch,
  onMounted,
  onUnmounted,
  nextTick
} from 'vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { useTodoListsStore } from '@/stores/todoLists'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'

const open = defineModel<boolean>({ default: false })

const workspaceStore = useWorkspaceStore()
const todoListsStore = useTodoListsStore()

const DEFAULT_HEX = '#E89623'

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '').trim()
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) return null
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16)
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase()
}

function rgbToHsv(
  r: number,
  g: number,
  b: number
): { h: number; s: number; v: number } {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      default:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  return {
    h: h * 360,
    s: max === 0 ? 0 : d / max,
    v: max
  }
}

function hsvToRgb(
  h: number,
  s: number,
  v: number
): { r: number; g: number; b: number } {
  const hh = ((h % 360) + 360) % 360
  const i = Math.floor(hh / 60)
  const f = hh / 60 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  let r = 0
  let g = 0
  let b = 0
  switch (i % 6) {
    case 0:
      r = v
      g = t
      b = p
      break
    case 1:
      r = q
      g = v
      b = p
      break
    case 2:
      r = p
      g = v
      b = t
      break
    case 3:
      r = p
      g = q
      b = v
      break
    case 4:
      r = t
      g = p
      b = v
      break
    default:
      r = v
      g = p
      b = q
      break
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

const name = ref('')
const description = ref('')
const colorHex = ref(DEFAULT_HEX)

const isSubmitting = ref(false)
const isError = ref(false)
const message = ref('')

const pickerOpen = ref(false)
const pickHue = ref(0)
const pickSat = ref(1)
const pickVal = ref(1)

const colorFieldRef = ref<HTMLElement | null>(null)
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

function applyHsvToHex() {
  const { r, g, b } = hsvToRgb(pickHue.value, pickSat.value, pickVal.value)
  colorHex.value = rgbToHex(r, g, b)
  syncInputFieldsFromHex()
}

function syncInputFieldsFromHex() {
  const rgb = hexToRgb(colorHex.value)
  if (!rgb) return
  hexField.value = colorHex.value.toUpperCase()
  rField.value = String(rgb.r)
  gField.value = String(rgb.g)
  bField.value = String(rgb.b)
}

const rgbParts = computed(() => {
  const hex = colorHex.value.replace('#', '')
  if (hex.length !== 6) {
    return { r: 0, g: 0, b: 0 }
  }
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) {
    return { r: 0, g: 0, b: 0 }
  }
  return { r, g, b }
})

const displayHex = computed(() => colorHex.value.toUpperCase())

const svThumbStyle = computed(() => ({
  left: `${pickSat.value * 100}%`,
  top: `${(1 - pickVal.value) * 100}%`,
  backgroundColor: displayHex.value
}))

const hueThumbStyle = computed(() => ({
  left: `${(pickHue.value / 360) * 100}%`,
  backgroundColor: `hsl(${pickHue.value}, 100%, 50%)`
}))

const resetForm = () => {
  name.value = ''
  description.value = ''
  colorHex.value = DEFAULT_HEX
  isError.value = false
  message.value = ''
  isSubmitting.value = false
  pickerOpen.value = false
  syncHsvFromHex(DEFAULT_HEX)
  syncInputFieldsFromHex()
}

const close = () => {
  resetForm()
  open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) resetForm()
})

const onKeydown = (e: KeyboardEvent) => {
  if (!open.value) return
  if (e.key === 'Escape') {
    if (pickerOpen.value) {
      pickerOpen.value = false
      e.stopPropagation()
      return
    }
    close()
  }
}

function onDocumentPointerDown(e: PointerEvent) {
  if (!pickerOpen.value || !colorFieldRef.value) return
  if (colorFieldRef.value.contains(e.target as Node)) return
  pickerOpen.value = false
}

function setSvFromClient(clientX: number, clientY: number) {
  const el = svPanelRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const s = clamp((clientX - rect.left) / rect.width, 0, 1)
  const v = clamp(1 - (clientY - rect.top) / rect.height, 0, 1)
  pickSat.value = s
  pickVal.value = v
  applyHsvToHex()
}

function setHueFromClient(clientX: number) {
  const el = hueTrackRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  pickHue.value = clamp(
    ((clientX - rect.left) / rect.width) * 360,
    0,
    359.999
  )
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

async function togglePicker() {
  if (pickerOpen.value) {
    pickerOpen.value = false
    return
  }
  syncHsvFromHex(colorHex.value)
  syncInputFieldsFromHex()
  pickerOpen.value = true
  await nextTick()
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

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
})

const clearError = () => {
  isError.value = false
  message.value = ''
}

const handleSubmit = async () => {
  const trimmed = name.value.trim()
  if (!trimmed || isSubmitting.value) return

  const workspaceId = workspaceStore.activeWorkspace?.id
  if (!workspaceId) {
    isError.value = true
    message.value = 'No workspace selected.'
    return
  }

  isSubmitting.value = true
  isError.value = false
  message.value = ''

  try {
    await todoListsStore.createTodoList(workspaceId, {
      name: trimmed,
      description: description.value,
      color: colorHex.value
    })
    close()
  } catch (err) {
    isError.value = true
    message.value =
      err instanceof Error ? err.message : 'Failed to create todo list.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="add-todo-list-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-todo-list-popup-title"
    >
      <div
        class="add-todo-list-popup-backdrop"
        aria-hidden="true"
        @click="close"
      />
      <div class="add-todo-list-popup-card" @click.stop>
        <form class="add-todo-list-popup-form" @submit.prevent="handleSubmit">
          <h2 id="add-todo-list-popup-title" class="sr-only">New to do list</h2>

          <input
            v-model="name"
            type="text"
            name="todo-list-name"
            placeholder="To do list name"
            class="popup-input"
            :class="{ 'popup-input-error': isError }"
            autocomplete="off"
            @input="clearError"
          />

          <textarea
            v-model="description"
            name="todo-list-description"
            placeholder="Desctription"
            class="popup-description"
          />

          <div ref="colorFieldRef" class="color-field-wrap">
            <div
              v-show="pickerOpen"
              class="color-popover"
              role="dialog"
              aria-label="Color picker"
              @click.stop
            >
              <div class="color-popover-inner">
                <div
                  ref="svPanelRef"
                  class="sv-panel"
                  :style="{ '--hue': pickHue }"
                  @pointerdown="onSvPointerDown"
                  @pointermove="onSvPointerMove"
                  @pointerup="onSvPointerUp"
                  @pointercancel="onSvPointerUp"
                >
                  <div class="sv-thumb-ring" :style="svThumbStyle">
                    <span class="sv-thumb-dot" />
                  </div>
                </div>

                <div
                  ref="hueTrackRef"
                  class="hue-track"
                  @pointerdown="onHuePointerDown"
                  @pointermove="onHuePointerMove"
                  @pointerup="onHuePointerUp"
                  @pointercancel="onHuePointerUp"
                >
                  <div class="hue-thumb-ring" :style="hueThumbStyle">
                    <span class="hue-thumb-dot" />
                  </div>
                </div>

                <div class="color-inputs-grid">
                  <label class="color-input-label">
                    <span class="color-input-caption">Hex</span>
                    <input
                      v-model="hexField"
                      type="text"
                      class="color-value-input color-value-input-hex"
                      maxlength="7"
                      spellcheck="false"
                      @change="onHexFieldChange"
                    />
                  </label>
                  <label class="color-input-label">
                    <span class="color-input-caption">R</span>
                    <input
                      v-model="rField"
                      type="text"
                      inputmode="numeric"
                      class="color-value-input"
                      maxlength="3"
                      @change="onRgbFieldCommit"
                    />
                  </label>
                  <label class="color-input-label">
                    <span class="color-input-caption">G</span>
                    <input
                      v-model="gField"
                      type="text"
                      inputmode="numeric"
                      class="color-value-input"
                      maxlength="3"
                      @change="onRgbFieldCommit"
                    />
                  </label>
                  <label class="color-input-label">
                    <span class="color-input-caption">B</span>
                    <input
                      v-model="bField"
                      type="text"
                      inputmode="numeric"
                      class="color-value-input"
                      maxlength="3"
                      @change="onRgbFieldCommit"
                    />
                  </label>
                </div>
              </div>
              <div class="color-popover-arrow" aria-hidden="true" />
            </div>

            <button
              type="button"
              class="color-row"
              :class="{ 'color-row-active': pickerOpen }"
              aria-label="Open color picker"
              :aria-expanded="pickerOpen"
              @click.stop="togglePicker"
            >
              <span
                class="color-swatch"
                :style="{ backgroundColor: displayHex }"
                aria-hidden="true"
              />
              <span class="color-row-values">
                <span class="color-hex">{{ displayHex }}</span>
                <span class="color-rgb">
                  <span>R {{ rgbParts.r }}</span>
                  <span>G {{ rgbParts.g }}</span>
                  <span>B {{ rgbParts.b }}</span>
                </span>
              </span>
            </button>
          </div>

          <div class="popup-button-wrap">
            <base-button
              class="popup-create-button"
              :is-loading="isSubmitting"
              text="Create folder"
            />
          </div>
          <p v-if="message" class="add-todo-list-popup-error">{{ message }}</p>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.add-todo-list-popup-overlay {
  @apply fixed inset-0 z-100 flex items-center justify-center p-6;
}

.add-todo-list-popup-backdrop {
  @apply absolute inset-0 bg-black/60 backdrop-blur-sm;
}

.add-todo-list-popup-card {
  @apply relative z-1 box-border flex w-[578px] max-w-[calc(100vw-3rem)] flex-col overflow-visible rounded-[22px] border border-white/10 shadow-2xl;
  min-height: 587px;
  background-color: #1a1a1a;
}

.add-todo-list-popup-form {
  @apply flex w-full flex-1 flex-col items-center overflow-visible px-[19.5px] pb-10 pt-[64px];
}

.popup-input {
  @apply h-[52px] w-[539px] max-w-full rounded-[10px] border border-white/10 px-[20px] text-[16px] font-semibold text-white placeholder:text-[#7D7D7D] focus:outline-none;
  background-color: #262626;
}

.popup-input-error {
  @apply border-red-500;
}

.popup-description {
  @apply mt-[28px] h-[205px] w-[539px] max-w-full resize-none rounded-[10px] border border-white/10 px-[20px] py-[17px] text-[16px] font-semibold text-white placeholder:text-[#7D7D7D] focus:outline-none;
  background-color: #262626;
}

.color-field-wrap {
  @apply relative z-20 mt-[28px] w-[539px] max-w-full;
}

.color-popover {
  @apply absolute left-1/2 z-30 w-[min(100%,320px)] min-w-[260px] -translate-x-1/2;
  bottom: calc(100% + 14px);
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.35));
}

.color-popover-inner {
  @apply rounded-[14px] border border-black/10 bg-white;
  padding: 16px;
}

.color-popover-arrow {
  @apply pointer-events-none absolute left-1/2 -translate-x-1/2;
  bottom: -9px;
  width: 18px;
  height: 9px;
  overflow: hidden;
}

.color-popover-arrow::before {
  content: '';
  @apply absolute left-1/2 block -translate-x-1/2;
  bottom: 2px;
  width: 14px;
  height: 14px;
  transform: translateX(-50%) rotate(45deg);
  border-right: 1px solid rgb(0 0 0 / 0.1);
  border-bottom: 1px solid rgb(0 0 0 / 0.1);
  background-color: #fff;
}

.sv-panel {
  @apply relative mb-3 h-[168px] w-full cursor-pointer select-none overflow-hidden rounded-[10px] touch-none;
  background-color: hsl(calc(var(--hue) * 1deg), 100%, 50%);
  background-image:
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, rgb(255 255 255 / 0));
}

.sv-thumb-ring {
  @apply pointer-events-none absolute z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_3px_rgba(0,0,0,0.35)];
}

.sv-thumb-dot {
  @apply absolute left-1/2 top-1/2 block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/15;
  background-color: inherit;
}

.hue-track {
  @apply relative mb-4 h-3.5 w-full cursor-pointer select-none rounded-full touch-none;
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

.hue-thumb-ring {
  @apply pointer-events-none absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_3px_rgba(0,0,0,0.35)];
}

.hue-thumb-dot {
  @apply absolute left-1/2 top-1/2 block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/15;
  background-color: inherit;
}

.color-inputs-grid {
  @apply grid grid-cols-[1fr_minmax(0,0.32fr)_minmax(0,0.32fr)_minmax(0,0.32fr)] gap-2;
}

.color-input-label {
  @apply flex min-w-0 flex-col gap-1;
}

.color-input-caption {
  @apply text-[11px] font-bold leading-none text-black;
}

.color-value-input {
  @apply h-9 w-full rounded-lg border border-black/15 bg-white px-1.5 text-center text-[13px] font-semibold text-black focus:border-black/30 focus:outline-none;
}

.color-value-input-hex {
  @apply px-2 text-left tracking-wide;
}

.color-row {
  @apply flex h-[83px] w-full cursor-pointer items-center gap-4 rounded-[10px] border border-white/10 px-[64px] text-left transition-colors hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30;
  background-color: #262626;
}

.color-row-active {
  @apply border-white/25 ring-1 ring-white/20;
}

.color-swatch {
  @apply h-10 w-10 shrink-0 rounded-[8px] border border-white/10;
}

.color-row-values {
  @apply flex min-w-0 flex-1 flex-row items-center justify-between gap-4;
}

.color-hex {
  @apply text-[16px] font-semibold tracking-wide text-white;
}

.color-rgb {
  @apply flex flex-wrap gap-x-6 gap-y-1 text-[16px] font-semibold text-white;
}

.popup-button-wrap {
  @apply mt-[40px] w-[460px] max-w-full;
}

.popup-create-button {
  @apply h-[56px]! w-full! rounded-[14px]! text-[16px]! font-semibold! leading-[100%]!;
}

.add-todo-list-popup-error {
  @apply mt-3 text-sm font-medium text-red-400;
}
</style>
