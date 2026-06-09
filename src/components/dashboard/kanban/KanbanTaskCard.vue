<script setup lang="ts">
import type { TodoTask } from '@/stores/todoLists'

defineProps<{
  task: TodoTask
  hidden: boolean
}>()

const emit = defineEmits<{
  dragstart: [event: DragEvent, task: TodoTask]
  dragend: [event: DragEvent]
  dragover: [event: DragEvent]
  drop: [event: DragEvent]
}>()

function formatTaskDate(deadlineAt: string | null): string {
  if (!deadlineAt) return ''
  const date = new Date(deadlineAt)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getDate()}.${date.getMonth() + 1}`
}
</script>

<template>
  <article
    draggable="true"
    data-task-card
    :data-task-id="task.id"
    class="relative h-[127px] w-full shrink-0 cursor-grab overflow-hidden rounded-[10px] bg-gradient-to-b from-[#343434] to-[#161616] transition-[opacity,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:cursor-grabbing"
    :class="{ 'opacity-0': hidden }"
    @dragstart="emit('dragstart', $event, task)"
    @dragend="emit('dragend', $event)"
    @dragover.prevent="emit('dragover', $event)"
    @drop.prevent="emit('drop', $event)"
  >
    <h3
      class="absolute left-[15px] top-[15px] text-[14px] font-bold tracking-[-0.154px] text-white"
    >
      {{ task.title }}
    </h3>
    <p
      v-if="task.description"
      class="absolute left-[15px] top-[44px] line-clamp-3 w-[228px] text-[10px] leading-normal tracking-[0.1px] text-white/50"
    >
      {{ task.description }}
    </p>
    <p
      v-if="formatTaskDate(task.deadlineAt)"
      class="absolute bottom-[13px] right-[15px] text-[10px] font-medium tracking-[0.1px] text-white"
    >
      {{ formatTaskDate(task.deadlineAt) }}
    </p>
  </article>
</template>
