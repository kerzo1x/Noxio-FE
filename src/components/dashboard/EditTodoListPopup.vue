<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useTodoListsStore, type TodoList } from '@/stores/todoLists'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  todoList: TodoList | null
}>()

const todoListsStore = useTodoListsStore()

const PRESET_COLORS = [
  '#E89623',
  '#AD2222',
  '#E85102',
  '#23A0E8',
  '#F900FD'
] as const

const DEFAULT_HEX = PRESET_COLORS[0]

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

function normalizeHex(hex: string): string {
  const h = hex.trim().replace(/^#/, '')
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) return DEFAULT_HEX
  return `#${h.toUpperCase()}`
}

function colorFromApi(color: string | null): string {
  if (!color) return DEFAULT_HEX
  return normalizeHex(color)
}

function isPresetColor(hex: string): boolean {
  const normalized = normalizeHex(hex)
  return PRESET_COLORS.some((preset) => normalizeHex(preset) === normalized)
}

const name = ref('')
const description = ref('')
const colorHex = ref<string>(DEFAULT_HEX)
const originalName = ref('')
const originalDescription = ref('')
const originalColorHex = ref<string>(DEFAULT_HEX)

const isSubmitting = ref(false)
const isError = ref(false)
const message = ref('')

const pickerOpen = ref(false)
const pickHue = ref(0)
const pickSat = ref(1)
const pickVal = ref(1)

const pickerPanelRef = ref<HTMLElement | null>(null)
const customSwatchRef = ref<HTMLElement | null>(null)
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

const displayHex = computed(() => colorHex.value.toUpperCase())

const previewColorStyle = computed(() => ({
  backgroundColor: displayHex.value
}))

const isCustomColorActive = computed(
  () => pickerOpen.value || !isPresetColor(colorHex.value)
)

const customSwatchStyle = computed(() => ({
  backgroundColor: isCustomColorActive.value ? displayHex.value : '#000000'
}))

const svThumbStyle = computed(() => ({
  left: `${pickSat.value * 100}%`,
  top: `${(1 - pickVal.value) * 100}%`,
  backgroundColor: displayHex.value
}))

const hueThumbStyle = computed(() => ({
  left: `${(pickHue.value / 360) * 100}%`,
  backgroundColor: `hsl(${pickHue.value}, 100%, 50%)`
}))

function isPresetSelected(preset: string): boolean {
  return (
    isPresetColor(colorHex.value) &&
    normalizeHex(colorHex.value) === normalizeHex(preset)
  )
}

function selectPreset(hex: string) {
  colorHex.value = normalizeHex(hex)
  pickerOpen.value = false
  syncHsvFromHex(colorHex.value)
}

const isUnchanged = computed(() => {
  const trimmedName = name.value.trim()
  const trimmedDescription = description.value.trim()
  return (
    trimmedName === originalName.value &&
    trimmedDescription === originalDescription.value &&
    normalizeHex(colorHex.value) === normalizeHex(originalColorHex.value)
  )
})

const resetForm = () => {
  name.value = ''
  description.value = ''
  colorHex.value = DEFAULT_HEX
  originalName.value = ''
  originalDescription.value = ''
  originalColorHex.value = DEFAULT_HEX
  isError.value = false
  message.value = ''
  isSubmitting.value = false
  pickerOpen.value = false
  syncHsvFromHex(DEFAULT_HEX)
  syncInputFieldsFromHex()
}

const prefillFromTodoList = () => {
  if (!props.todoList) return
  const listName = props.todoList.name
  const listDescription = props.todoList.description ?? ''
  const listColor = colorFromApi(props.todoList.color)

  name.value = listName
  description.value = listDescription
  colorHex.value = listColor
  originalName.value = listName
  originalDescription.value = listDescription
  originalColorHex.value = listColor
  syncHsvFromHex(listColor)
  syncInputFieldsFromHex()
}

const close = () => {
  resetForm()
  open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) {
    prefillFromTodoList()
    return
  }
  resetForm()
})

watch(
  () => props.todoList,
  () => {
    if (open.value) prefillFromTodoList()
  }
)

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
  if (!pickerOpen.value) return
  const target = e.target as Node
  if (pickerPanelRef.value?.contains(target)) return
  if (customSwatchRef.value?.contains(target)) return
  pickerOpen.value = false
}

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

function togglePicker() {
  if (pickerOpen.value) {
    pickerOpen.value = false
    return
  }
  syncHsvFromHex(colorHex.value)
  syncInputFieldsFromHex()
  pickerOpen.value = true
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
      window as Window & { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }
    ).EyeDropper()
    const result = await dropper.open()
    if (result?.sRGBHex) {
      colorHex.value = normalizeHex(result.sRGBHex)
      syncHsvFromHex(colorHex.value)
      syncInputFieldsFromHex()
    }
  } catch {
    /* cancelled */
  }
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
  if (!trimmed || isSubmitting.value || isUnchanged.value || !props.todoList) return

  isSubmitting.value = true
  isError.value = false
  message.value = ''

  try {
    await todoListsStore.updateTodoList(props.todoList.id, {
      name: trimmed,
      description: description.value,
      color: colorHex.value,
      originalName: originalName.value,
      originalDescription: props.todoList.description,
      originalColor: props.todoList.color
    })
    close()
  } catch (err) {
    isError.value = true
    message.value =
      err instanceof Error ? err.message : 'Failed to update todo list.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && todoList"
      class="todo-list-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-todo-list-popup-title"
    >
      <div
        class="todo-list-popup-backdrop"
        aria-hidden="true"
        @click="close"
      />

      <div class="todo-list-popup-card" @click.stop>
        <form class="todo-list-popup-form" @submit.prevent="handleSubmit">
          <div class="todo-list-popup-body">
            <div class="todo-list-popup-header">
              <h2 id="edit-todo-list-popup-title" class="todo-list-popup-title">
                Edit to do list
              </h2>
              <button
                type="button"
                class="todo-list-popup-cancel"
                @click="close"
              >
                Cancel
              </button>
            </div>

            <div class="todo-list-popup-fields">
              <input
                v-model="name"
                type="text"
                name="todo-list-name"
                placeholder="To do list name"
                class="todo-list-popup-field"
                :class="{ 'todo-list-popup-field--error': isError }"
                autocomplete="off"
                @input="clearError"
              />

              <textarea
                v-model="description"
                name="todo-list-description"
                placeholder="Description"
                class="todo-list-popup-field todo-list-popup-field--textarea"
              />
            </div>

            <div class="todo-list-popup-swatches">
              <button
                v-for="preset in PRESET_COLORS"
                :key="preset"
                type="button"
                class="todo-list-popup-swatch"
                :class="{
                  'todo-list-popup-swatch--selected': isPresetSelected(preset)
                }"
                :style="{ backgroundColor: preset }"
                :aria-label="`Select color ${preset}`"
                :aria-pressed="isPresetSelected(preset)"
                @click="selectPreset(preset)"
              />

              <button
                ref="customSwatchRef"
                type="button"
                class="todo-list-popup-swatch todo-list-popup-swatch--custom"
                :class="{
                  'todo-list-popup-swatch--selected': isCustomColorActive
                }"
                :style="customSwatchStyle"
                aria-label="Open color picker"
                :aria-expanded="pickerOpen"
                @click.stop="togglePicker"
              />
            </div>
          </div>

          <div class="todo-list-popup-footer">
            <button
              type="submit"
              class="todo-list-popup-submit"
              :disabled="isSubmitting || !name.trim() || isUnchanged"
            >
              {{ isSubmitting ? 'Loading...' : 'Save changes' }}
            </button>
            <p v-if="message" class="todo-list-popup-error">{{ message }}</p>
          </div>
        </form>

        <div
          v-show="pickerOpen"
          ref="pickerPanelRef"
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
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

/* Figma 1727:6065 popup, 1727:6066 placement, 1727:6294 picker */
.todo-list-popup-overlay {
  @apply fixed inset-0 z-100 flex items-center justify-center p-4;
}

.todo-list-popup-backdrop {
  @apply absolute inset-0 bg-black/60 backdrop-blur-sm;
}

.todo-list-popup-card {
  @apply relative z-1 box-border w-full max-w-2xl shrink-0 overflow-visible rounded-xl border-2 border-neutral-900 bg-black px-18 pb-10 pt-9.5;
}

.todo-list-popup-form {
  @apply flex w-full flex-col gap-20;
}

.todo-list-popup-body {
  @apply flex w-full flex-col gap-11;
}

.todo-list-popup-header {
  @apply flex w-full items-center justify-between gap-4;
}

.todo-list-popup-title {
  @apply text-base font-medium leading-none tracking-wide text-white;
}

.todo-list-popup-cancel {
  @apply shrink-0 text-sm font-medium leading-none tracking-wide text-white/50 transition-colors hover:text-white;
}

.todo-list-popup-fields {
  @apply flex w-full flex-col gap-5;
}

.todo-list-popup-field {
  @apply box-border w-full rounded-xl border-0 bg-neutral-800 px-6 text-sm font-medium leading-normal tracking-tight text-white outline-none transition-shadow placeholder:text-white/50 focus:ring-1 focus:ring-white/20;
  @apply h-13 py-0;
}

.todo-list-popup-field--textarea {
  @apply h-33 min-h-0 resize-none py-4;
}

.todo-list-popup-field--error {
  @apply ring-2 ring-red-500;
}

.todo-list-popup-swatches {
  @apply flex flex-wrap items-center gap-2;
}

.todo-list-popup-swatch {
  @apply size-12 shrink-0 cursor-pointer rounded-[6px] border-0 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40;
}

.todo-list-popup-swatch--selected {
  @apply ring-2 ring-white ring-offset-2 ring-offset-black;
}

.todo-list-popup-swatch--custom {
  @apply border border-[#373737];
}

.color-picker-panel {
  @apply absolute left-[349px] top-[89px] z-30 flex w-[189px] flex-col items-center gap-2 rounded-[4px] bg-[#1c1b1b] p-2;
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

.todo-list-popup-footer {
  @apply flex w-full flex-col gap-3;
}

.todo-list-popup-submit {
  @apply flex w-full items-center justify-center rounded-xl bg-white px-3 py-4 text-base font-medium leading-none tracking-wide text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40;
}

.todo-list-popup-error {
  @apply text-center text-sm font-medium text-red-400;
}
</style>
