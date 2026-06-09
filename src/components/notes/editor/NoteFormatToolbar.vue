<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
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
const sizeDropdownOpen = ref(false)

function toggleSizeDropdown() {
  sizeDropdownOpen.value = !sizeDropdownOpen.value
}

function closeSizeDropdown() {
  sizeDropdownOpen.value = false
}

function selectSize(value: NoteBlockSize) {
  emit('update:size', value)
  closeSizeDropdown()
}

function onDocumentClick(e: MouseEvent) {
  if (!rootRef.value?.contains(e.target as Node)) {
    closeSizeDropdown()
  }
}

function onDocumentKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeSizeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onDocumentKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <div
    ref="rootRef"
    class="flex h-[46px] items-center gap-3 rounded-[10px] bg-[#fafafa] px-4"
    role="toolbar"
    aria-label="Text formatting"
  >
    <div class="relative shrink-0">
      <button
        type="button"
        class="relative flex h-[46px] items-center gap-2 bg-[#e8e7e7] pl-7 pr-9 text-base font-medium leading-normal text-black outline-none transition-opacity hover:opacity-80"
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
        class="absolute left-0 right-0 bottom-[calc(100%+4px)] z-50 overflow-hidden rounded-[8px] border border-black/10 bg-[#fafafa] py-1 shadow-[0_-4px_16px_rgba(0,0,0,0.12)]"
        role="listbox"
        @mousedown.prevent
        @click.stop
      >
        <button
          v-for="option in sizeOptions"
          :key="option.value"
          type="button"
          role="option"
          :aria-selected="size === option.value"
          class="w-full px-4 py-2 text-left text-base font-medium leading-normal text-black transition-colors hover:bg-black/5"
          :class="size === option.value ? 'bg-black/5' : ''"
          @click="selectSize(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div
      class="h-6 w-px shrink-0 bg-black/10"
      aria-hidden="true"
    />

    <button
      type="button"
      class="flex size-8 shrink-0 items-center justify-center rounded-md text-base font-bold text-black transition-colors hover:bg-black/5"
      :class="boldActive ? 'bg-black/10' : ''"
      title="Bold"
      :aria-pressed="boldActive"
      @mousedown.prevent
      @click="emit('toggleBold')"
    >
      B
    </button>
    <button
      type="button"
      class="flex size-8 shrink-0 items-center justify-center rounded-md text-base font-medium text-black underline transition-colors hover:bg-black/5"
      :class="underlineActive ? 'bg-black/10' : ''"
      title="Underline"
      :aria-pressed="underlineActive"
      @mousedown.prevent
      @click="emit('toggleUnderline')"
    >
      U
    </button>

    <div
      class="h-6 w-px shrink-0 bg-black/10"
      aria-hidden="true"
    />

    <div class="flex shrink-0 items-center gap-1.5">
      <button
        v-for="color in COLOR_PRESETS"
        :key="color"
        type="button"
        class="size-5 rounded-full border border-black/15 transition-transform hover:scale-110"
        :style="{ backgroundColor: color }"
        :title="color"
        @mousedown.prevent
        @click="emit('setColor', color)"
      />
      <input
        type="color"
        class="size-5 cursor-pointer rounded border-0 bg-transparent p-0"
        title="Custom color"
        @mousedown.prevent
        @input="emit('setColor', ($event.target as HTMLInputElement).value)"
      >
    </div>
  </div>
</template>
