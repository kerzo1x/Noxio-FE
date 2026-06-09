<script setup lang="ts">
import { TransitionGroup } from 'vue'
import KanbanTaskCard from '@/components/dashboard/kanban/KanbanTaskCard.vue'
import type { TodoTask, TodoTaskStatus } from '@/stores/todoLists'

const props = defineProps<{
  status: TodoTaskStatus
  label: string
  countColor: string
  tasks: TodoTask[]
  taskCount: number
  draggedTaskId: string | null
  dropLineBase: string
  dropLineActive: string
  dropLineHint: string
  dropLineHidden: string
  hideDragSource: boolean
  isDropSlotActive: (status: TodoTaskStatus, index: number) => boolean
  isDropSlotHintVisible: (status: TodoTaskStatus, index: number) => boolean
  isDraggingTask: (taskId: string) => boolean
}>()

const emit = defineEmits<{
  dragenter: [event: DragEvent]
  dragover: [event: DragEvent, status: TodoTaskStatus]
  drop: [event: DragEvent, status: TodoTaskStatus]
  taskDragstart: [event: DragEvent, task: TodoTask]
  taskDragend: [event: DragEvent]
}>()

function dropLineClass(index: number) {
  if (props.isDropSlotActive(props.status, index)) return props.dropLineActive
  if (props.isDropSlotHintVisible(props.status, index)) return props.dropLineHint
  return props.dropLineHidden
}

function emptyColumnDropLineClass() {
  if (props.isDropSlotActive(props.status, 0)) return props.dropLineActive
  if (props.draggedTaskId) return props.dropLineHint
  return props.dropLineHidden
}

function onTaskDragOver(event: DragEvent) {
  if (!props.hideDragSource) return
  emit('dragover', event, props.status)
}
</script>

<template>
  <div class="flex min-h-full min-w-0 flex-col">
    <h2
      class="sticky top-0 z-[1] mb-5 shrink-0 bg-black pb-2 text-[16px] font-semibold tracking-[-0.176px] text-white"
    >
      {{ label }}
      <span :style="{ color: countColor }"> ({{ taskCount }}) </span>
    </h2>
    <div
      class="column-drop-zone flex min-h-[calc(100dvh-240px)] flex-1 flex-col"
      @dragenter="emit('dragenter', $event)"
      @dragover="emit('dragover', $event, status)"
      @drop.prevent="emit('drop', $event, status)"
    >
      <div
        v-if="tasks.length === 0"
        class="flex h-[20px] shrink-0 items-center px-1"
      >
        <div
          :class="[dropLineBase, emptyColumnDropLineClass()]"
          aria-hidden="true"
        />
      </div>

      <TransitionGroup
        v-else
        name="todo-task"
        tag="div"
        class="flex shrink-0 flex-col"
      >
        <div
          v-for="(task, index) in tasks"
          :key="task.id"
          class="flex flex-col"
        >
          <div class="flex h-[20px] shrink-0 items-center px-1">
            <div
              :class="[dropLineBase, dropLineClass(index)]"
              aria-hidden="true"
            />
          </div>

          <KanbanTaskCard
            :task="task"
            :hidden="hideDragSource && isDraggingTask(task.id)"
            @dragstart="(event, t) => emit('taskDragstart', event, t)"
            @dragend="(event) => emit('taskDragend', event)"
            @dragover="onTaskDragOver"
            @drop="emit('drop', $event, status)"
          />
        </div>
      </TransitionGroup>

      <div
        class="column-drop-fill flex min-h-[127px] flex-1 flex-col"
        @dragenter="emit('dragenter', $event)"
        @dragover="emit('dragover', $event, status)"
        @drop.prevent="emit('drop', $event, status)"
      >
        <div
          v-if="tasks.length > 0"
          class="flex h-[20px] shrink-0 items-center px-1"
        >
          <div
            :class="[dropLineBase, dropLineClass(tasks.length)]"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.todo-task-move {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
