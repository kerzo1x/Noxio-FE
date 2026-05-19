<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { NoteBlockSize } from '@/types/notes'

defineProps<{
  size: NoteBlockSize
  bold: boolean
}>()

const emit = defineEmits<{
  'update:size': [NoteBlockSize]
  toggleBold: []
}>()

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
    class="flex h-[46px] w-full max-w-[22.0625rem] items-center gap-9 rounded-[10px] bg-[#fafafa] px-8"
    role="toolbar"
    aria-label="Text formatting"
  >
    <button
      type="button"
      disabled
      title="Underline is not supported yet"
      class="cursor-not-allowed text-[19px] font-normal leading-normal text-black/40 underline decoration-from-font underline-offset-2"
    >
      U
    </button>

    <button
      type="button"
      title="Bold"
      class="text-[19px] font-bold leading-normal text-black transition-opacity hover:opacity-70"
      :class="bold ? 'opacity-100' : 'opacity-60'"
      @mousedown.prevent
      @click="emit('toggleBold')"
    >
      B
    </button>

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

    <button
      type="button"
      disabled
      title="Text color is not supported yet"
      class="inline-flex cursor-not-allowed flex-col items-center justify-center gap-0.5 text-black/40"
    >
      <span class="text-[19px] font-medium leading-none">A</span>
      <span class="h-[3px] w-[23px] rounded-[10px] bg-[#ad2222]/40" />
    </button>
  </div>
</template>
