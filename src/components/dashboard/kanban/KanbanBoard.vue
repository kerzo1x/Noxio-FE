<script setup lang="ts">
import { computed } from 'vue'
import KanbanColumn from '@/components/dashboard/kanban/KanbanColumn.vue'
import { useTaskDragDrop } from '@/composables/useTaskDragDrop'
import { useTodoListsStore, type TodoTask, type TodoTaskStatus } from '@/stores/todoLists'

const columns: {
  status: TodoTaskStatus
  label: string
  countColor: string
}[] = [
  { status: 'TODO', label: 'To do', countColor: '#6a84e3' },
  { status: 'IN_PROGRESS', label: 'In progress', countColor: '#eae35f' },
  { status: 'DONE', label: 'Done', countColor: '#59c86d' },
]

const todoListsStore = useTodoListsStore()

const tasksByColumn = computed(() => {
  const grouped: Record<TodoTaskStatus, TodoTask[]> = {
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  }
  for (const task of todoListsStore.tasks) {
    grouped[task.status].push(task)
  }
  for (const status of Object.keys(grouped) as TodoTaskStatus[]) {
    grouped[status].sort((a, b) => a.position - b.position)
  }
  return grouped
})

function tasksForColumn(status: TodoTaskStatus) {
  return tasksByColumn.value[status]
}

function columnCount(status: TodoTaskStatus) {
  return tasksForColumn(status).length
}

const {
  draggedTaskId,
  hideDragSource,
  dropLineBase,
  dropLineActive,
  dropLineHint,
  dropLineHidden,
  onDragStart,
  onDragEnd,
  onColumnDragEnter,
  onColumnDragOver,
  onColumnDrop,
  isDropSlotActive,
  isDropSlotHintVisible,
  isDraggingTask,
} = useTaskDragDrop(tasksForColumn, (taskId, status, index) => {
  void todoListsStore.moveTask(taskId, status, index)
})
</script>

<template>
  <div class="grid min-h-full w-full flex-1 grid-cols-3 gap-5">
    <KanbanColumn
      v-for="column in columns"
      :key="column.status"
      :status="column.status"
      :label="column.label"
      :count-color="column.countColor"
      :tasks="tasksForColumn(column.status)"
      :task-count="columnCount(column.status)"
      :dragged-task-id="draggedTaskId"
      :drop-line-base="dropLineBase"
      :drop-line-active="dropLineActive"
      :drop-line-hint="dropLineHint"
      :drop-line-hidden="dropLineHidden"
      :hide-drag-source="hideDragSource"
      :is-drop-slot-active="isDropSlotActive"
      :is-drop-slot-hint-visible="isDropSlotHintVisible"
      :is-dragging-task="isDraggingTask"
      @dragenter="onColumnDragEnter"
      @dragover="onColumnDragOver"
      @drop="onColumnDrop"
      @task-dragstart="onDragStart"
      @task-dragend="onDragEnd"
    />
  </div>
</template>
