<script setup lang="ts">
import { ref, watch } from 'vue'
import { clamp, hexToRgb, normalizeHex, rgbToHex } from '@/utils/colorUtils'

const colorHex = defineModel<string>({ required: true })

const hexField = ref('')
const rField = ref('')
const gField = ref('')
const bField = ref('')

function syncFieldsFromHex(hex: string) {
  const rgb = hexToRgb(hex)
  if (!rgb) return
  hexField.value = hex.toUpperCase()
  rField.value = String(rgb.r)
  gField.value = String(rgb.g)
  bField.value = String(rgb.b)
}

watch(
  colorHex,
  (hex) => syncFieldsFromHex(normalizeHex(hex, colorHex.value)),
  { immediate: true },
)

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
}

defineExpose({ syncFieldsFromHex })
</script>

<template>
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
</template>

<style scoped>
@reference '@/assets/styles/main.css';

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
