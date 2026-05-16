<script setup lang="ts">
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
</script>

<template>
  <div
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

    <label
      class="relative flex h-[46px] shrink-0 items-center bg-[#e8e7e7] pl-7 pr-9"
    >
      <select
        :value="size"
        class="cursor-pointer appearance-none bg-transparent text-base font-medium leading-normal text-black outline-none"
        @change="emit('update:size', ($event.target as HTMLSelectElement).value as NoteBlockSize)"
      >
        <option
          v-for="option in sizeOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <span
        class="pointer-events-none absolute right-3 top-1/2 size-0 -translate-y-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-black/70"
        aria-hidden="true"
      />
    </label>

    <button
      type="button"
      disabled
      title="Text color is not supported yet"
      class="relative cursor-not-allowed text-[19px] font-medium leading-normal text-black/40"
    >
      A
      <span class="absolute -bottom-0.5 left-0 h-[3px] w-[23px] rounded-[10px] bg-[#ad2222]/40" />
    </button>
  </div>
</template>
