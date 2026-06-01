<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import ColorPickerPanel from '@/components/ui/color/ColorPickerPanel.vue'
import { isPresetColor, normalizeHex } from '@/utils/colorUtils'

const props = withDefaults(
  defineProps<{
    presets: readonly string[]
    size?: 'sm' | 'lg'
    pickerPanelClass?: string
  }>(),
  {
    size: 'lg',
    pickerPanelClass: '',
  },
)

const colorHex = defineModel<string>({ required: true })
const pickerOpen = defineModel<boolean>('pickerOpen', { default: false })

const customSwatchRef = ref<HTMLElement | null>(null)
const pickerPanelRef = ref<HTMLElement | null>(null)

const displayHex = computed(() => colorHex.value.toUpperCase())

const isCustomColorActive = computed(
  () => pickerOpen.value || !isPresetColor(colorHex.value, props.presets),
)

const customSwatchStyle = computed(() => ({
  backgroundColor: isCustomColorActive.value ? displayHex.value : '#000000',
}))

function isPresetSelected(preset: string): boolean {
  return (
    isPresetColor(colorHex.value, props.presets) &&
    normalizeHex(colorHex.value) === normalizeHex(preset)
  )
}

function selectPreset(hex: string) {
  colorHex.value = normalizeHex(hex, props.presets[0] ?? '#FFFFFF')
  pickerOpen.value = false
}

function togglePicker() {
  pickerOpen.value = !pickerOpen.value
}

function onDocumentPointerDown(e: PointerEvent) {
  if (!pickerOpen.value) return
  const target = e.target as Node
  if (pickerPanelRef.value?.contains(target)) return
  if (customSwatchRef.value?.contains(target)) return
  pickerOpen.value = false
}

function closePicker() {
  pickerOpen.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
})

defineExpose({ closePicker })
</script>

<template>
  <div class="color-swatch-row" :class="`color-swatch-row--${size}`">
    <button
      v-for="preset in presets"
      :key="preset"
      type="button"
      class="color-swatch-row-swatch"
      :class="{ 'color-swatch-row-swatch--selected': isPresetSelected(preset) }"
      :style="{ backgroundColor: preset }"
      :aria-label="`Select color ${preset}`"
      :aria-pressed="isPresetSelected(preset)"
      @click="selectPreset(preset)"
    />

    <button
      ref="customSwatchRef"
      type="button"
      class="color-swatch-row-swatch color-swatch-row-swatch--custom"
      :class="{ 'color-swatch-row-swatch--selected': isCustomColorActive }"
      :style="customSwatchStyle"
      aria-label="Open color picker"
      :aria-expanded="pickerOpen"
      @click.stop="togglePicker"
    />

    <div
      v-show="pickerOpen"
      ref="pickerPanelRef"
      class="color-swatch-row-picker"
      :class="pickerPanelClass"
    >
      <ColorPickerPanel v-model="colorHex" />
    </div>
  </div>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.color-swatch-row {
  @apply relative flex flex-wrap items-center gap-2;
}

.color-swatch-row--lg .color-swatch-row-swatch {
  @apply size-12 shrink-0 cursor-pointer rounded-[6px] border-0 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40;
}

.color-swatch-row--sm .color-swatch-row-swatch {
  @apply size-[25px] shrink-0 cursor-pointer rounded-[3px] border-0 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40;
}

.color-swatch-row--sm .color-swatch-row-swatch--custom {
  @apply size-[29px] rounded-[4px];
}

.color-swatch-row-swatch--selected {
  @apply ring-2 ring-white ring-offset-2 ring-offset-black;
}

.color-swatch-row-swatch--custom {
  @apply border border-[#373737];
}

.color-swatch-row-picker {
  @apply absolute z-30;
}
</style>
