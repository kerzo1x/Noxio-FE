<script setup lang="ts">
import { ref } from 'vue'
import { useResizableSplit } from '@/composables/useResizableSplit'

const containerRef = ref<HTMLElement | null>(null)
const { listFlexStyle, isListCollapsed, isDragging, startDragging } =
  useResizableSplit(containerRef)
</script>

<template>
  <div
    ref="containerRef"
    class="flex h-full min-h-0 w-full"
  >
    <div
      class="flex min-h-0 shrink-0 flex-col items-stretch overflow-hidden transition-[flex-basis] duration-150 ease-out"
      :class="{ 'pointer-events-none opacity-0': isListCollapsed }"
      :style="listFlexStyle"
    >
      <slot name="list" />
    </div>

    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize notes panel"
      class="relative flex w-px shrink-0 cursor-col-resize self-stretch bg-[#212121] touch-none select-none"
      :class="{ 'bg-white/20': isDragging }"
      @pointerdown.prevent="startDragging"
    />

    <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <slot name="editor" />
    </div>
  </div>
</template>
