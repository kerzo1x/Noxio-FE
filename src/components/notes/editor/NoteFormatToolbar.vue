<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import ColorPickerPanel from '@/components/ui/color/ColorPickerPanel.vue'
import { useEscapeKey } from '@/composables/useEscapeKey'
import { isPresetColor, normalizeHex } from '@/utils/colorUtils'
import type { NoteBlockSize } from '@/types/notes'

defineProps<{
  size: NoteBlockSize
  boldActive?: boolean
  underlineActive?: boolean
}>()

const emit = defineEmits<{
  'update:size': [NoteBlockSize]
  toggleBold: []
  toggleUnderline: []
  setColor: [string]
}>()

const DEFAULT_COLOR = '#AD2222'

const COLOR_PRESETS = [
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#71717a',
] as const

const sizeOptions: { value: NoteBlockSize; label: string }[] = [
  { value: 'small', label: 'small' },
  { value: 'medium', label: 'medium' },
  { value: 'large', label: 'large' },
]

const rootRef = ref<HTMLElement | null>(null)
const paletteButtonRef = ref<HTMLElement | null>(null)
const colorPickerPanelRef = ref<HTMLElement | null>(null)

const sizeDropdownOpen = ref(false)
const colorPopupOpen = ref(false)
const colorPickerOpen = ref(false)
const activeColor = ref(DEFAULT_COLOR)
const customPickerColor = ref(DEFAULT_COLOR)

function toggleSizeDropdown() {
  colorPopupOpen.value = false
  colorPickerOpen.value = false
  sizeDropdownOpen.value = !sizeDropdownOpen.value
}

function closeSizeDropdown() {
  sizeDropdownOpen.value = false
}

function toggleColorPopup() {
  sizeDropdownOpen.value = false
  colorPickerOpen.value = false
  colorPopupOpen.value = !colorPopupOpen.value
}

function closeColorPopup() {
  colorPopupOpen.value = false
  colorPickerOpen.value = false
}

function closeAllPopups() {
  closeSizeDropdown()
  closeColorPopup()
}

function selectSize(value: NoteBlockSize) {
  emit('update:size', value)
  closeSizeDropdown()
}

function selectPresetColor(color: string) {
  activeColor.value = normalizeHex(color, DEFAULT_COLOR)
  emit('setColor', activeColor.value)
}

function openCustomPicker() {
  if (!isPresetColor(activeColor.value, COLOR_PRESETS)) {
    customPickerColor.value = activeColor.value
  }
  colorPickerOpen.value = !colorPickerOpen.value
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node

  if (colorPickerOpen.value) {
    if (colorPickerPanelRef.value?.contains(target)) return
    if (paletteButtonRef.value?.contains(target)) return
    colorPickerOpen.value = false
    return
  }

  if (!rootRef.value?.contains(target)) {
    closeAllPopups()
  }
}

watch(customPickerColor, (color) => {
  if (!colorPickerOpen.value) return
  activeColor.value = normalizeHex(color, DEFAULT_COLOR)
  emit('setColor', activeColor.value)
})

useEscapeKey(closeAllPopups)

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
})
</script>

<template>
  <div
    ref="rootRef"
    class="flex h-[46px] w-[353px] items-center justify-center gap-[38px] rounded-[10px] bg-[#fafafa] px-8"
    role="toolbar"
    aria-label="Text formatting"
  >
    <button
      type="button"
      class="shrink-0 cursor-pointer text-[19px] font-normal leading-normal text-black/50 underline transition-colors hover:text-black/70"
      :class="underlineActive ? 'text-black/80' : ''"
      title="Underline"
      :aria-pressed="underlineActive"
      @mousedown.prevent
      @click="emit('toggleUnderline')"
    >
      U
    </button>

    <button
      type="button"
      class="shrink-0 cursor-pointer text-[19px] font-bold leading-normal text-black/50 transition-colors hover:text-black/70"
      :class="boldActive ? 'text-black/80' : ''"
      title="Bold"
      :aria-pressed="boldActive"
      @mousedown.prevent
      @click="emit('toggleBold')"
    >
      B
    </button>

    <div class="relative h-[46px] w-[125px] shrink-0">
      <button
        type="button"
        class="relative flex h-full w-full cursor-pointer items-center justify-center bg-[rgba(232,231,231,0.5)] pl-7 pr-8 text-base font-medium leading-normal text-black/50 outline-none transition-opacity hover:opacity-80"
        :aria-expanded="sizeDropdownOpen"
        aria-haspopup="listbox"
        @mousedown.prevent
        @click.stop="toggleSizeDropdown"
      >
        {{ size }}
        <span
          class="pointer-events-none absolute right-3 top-1/2 size-0 -translate-y-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-black/70 transition-transform"
          :class="{ 'rotate-180': sizeDropdownOpen }"
          aria-hidden="true"
        />
      </button>

      <div
        v-show="sizeDropdownOpen"
        class="absolute bottom-[calc(100%+4px)] left-0 right-0 z-50 overflow-hidden rounded-[8px] border border-black/10 bg-[#fafafa] py-1 shadow-[0_-4px_16px_rgba(0,0,0,0.12)]"
        role="listbox"
        @mousedown.prevent
        @click.stop
      >
        <button
          v-for="option in sizeOptions"
          :key="option.value"
          type="button"
          role="option"
          class="w-full cursor-pointer px-4 py-2 text-left text-base font-medium leading-normal text-black transition-colors hover:bg-black/5"
          :class="size === option.value ? 'bg-black/5' : ''"
          :aria-selected="size === option.value"
          @click="selectSize(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div class="relative h-[26px] w-[23px] shrink-0">
      <button
        type="button"
        class="flex h-full w-full cursor-pointer flex-col items-center gap-px outline-none"
        :aria-expanded="colorPopupOpen"
        aria-haspopup="dialog"
        aria-label="Text color"
        @mousedown.prevent
        @click.stop="toggleColorPopup"
      >
        <span class="text-[19px] font-medium leading-none text-black/50">A</span>
        <span
          class="h-[3px] w-full rounded-[10px]"
          :style="{ backgroundColor: activeColor }"
          aria-hidden="true"
        />
      </button>

      <div
        v-show="colorPopupOpen"
        class="absolute bottom-[calc(100%+18px)] right-0 z-50 flex items-center gap-2 rounded-[10px] border border-black/[0.08] bg-[#fafafa] p-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.12)]"
        role="dialog"
        aria-label="Text color"
        @mousedown.prevent
        @click.stop
      >
        <button
          v-for="color in COLOR_PRESETS"
          :key="color"
          type="button"
          class="size-6 shrink-0 cursor-pointer rounded-full border border-black/[0.12] transition-transform hover:scale-110"
          :class="{
            'ring-2 ring-black/15 ring-offset-1 ring-offset-[#fafafa]':
              normalizeHex(activeColor) === normalizeHex(color),
          }"
          :style="{ backgroundColor: color }"
          :title="color"
          :aria-label="`Select color ${color}`"
          @click="selectPresetColor(color)"
        />

        <div class="relative shrink-0">
          <button
            ref="paletteButtonRef"
            type="button"
            class="note-format-custom-color size-6 shrink-0 cursor-pointer rounded-full border border-black/[0.12] transition-transform hover:scale-110"
            :class="{
              'ring-2 ring-black/15 ring-offset-1 ring-offset-[#fafafa]':
                colorPickerOpen || !isPresetColor(activeColor, COLOR_PRESETS),
            }"
            aria-label="Open custom color picker"
            :aria-expanded="colorPickerOpen"
            @click.stop="openCustomPicker"
          />

          <div
            v-show="colorPickerOpen"
            ref="colorPickerPanelRef"
            class="note-format-color-picker-panel absolute bottom-[calc(100%+18px)] right-0 z-[60]"
            @mousedown.stop
            @click.stop
          >
            <ColorPickerPanel v-model="customPickerColor" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.note-format-custom-color {
  background: conic-gradient(
    #ef4444,
    #f97316,
    #eab308,
    #22c55e,
    #3b82f6,
    #a855f7,
    #ef4444
  );
}
</style>
