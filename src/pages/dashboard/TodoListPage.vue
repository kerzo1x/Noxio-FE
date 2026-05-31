<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import AddTaskPopup from '@/components/dashboard/AddTaskPopup.vue'
import { useTodoListsStore, type TodoTask, type TodoTaskStatus } from '@/stores/todoLists'

type PeriodFilter = 'today' | 'week' | 'month' | 'all'

const props = defineProps<{
  todoListId: string
}>()

const router = useRouter()
const todoListsStore = useTodoListsStore()

const activePeriod = ref<PeriodFilter>('week')
const showAddTaskPopup = ref(false)

const periodOptions: { id: PeriodFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All' },
]

const columns: {
  status: TodoTaskStatus
  label: string
  countColor: string
}[] = [
  { status: 'TODO', label: 'To do', countColor: '#6a84e3' },
  { status: 'IN_PROGRESS', label: 'In progress', countColor: '#eae35f' },
  { status: 'DONE', label: 'Done', countColor: '#59c86d' },
]

const draggedTaskId = ref<string | null>(null)
const dropTarget = ref<{ status: TodoTaskStatus; index: number } | null>(null)

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

function formatTaskDate(deadlineAt: string | null): string {
  if (!deadlineAt) return ''
  const date = new Date(deadlineAt)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getDate()}.${date.getMonth() + 1}`
}

function handleAddTask() {
  showAddTaskPopup.value = true
}

function onDragStart(event: DragEvent, task: TodoTask) {
  draggedTaskId.value = task.id
  dropTarget.value = null
  event.dataTransfer?.setData('text/plain', task.id)
  event.dataTransfer!.effectAllowed = 'move'
}

function onDragEnd() {
  draggedTaskId.value = null
  dropTarget.value = null
}

function getInsertIndex(event: DragEvent, index: number) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  return event.clientY < rect.top + rect.height / 2 ? index : index + 1
}

function onTaskDragOver(event: DragEvent, status: TodoTaskStatus, index: number) {
  event.preventDefault()
  if (!draggedTaskId.value) return
  event.dataTransfer!.dropEffect = 'move'
  dropTarget.value = { status, index: getInsertIndex(event, index) }
}

function onColumnDragOver(event: DragEvent, status: TodoTaskStatus) {
  event.preventDefault()
  if (!draggedTaskId.value) return
  event.dataTransfer!.dropEffect = 'move'
  dropTarget.value = { status, index: tasksForColumn(status).length }
}

function onDrop(status: TodoTaskStatus, index: number) {
  if (!draggedTaskId.value) return
  todoListsStore.moveTaskLocally(draggedTaskId.value, status, index)
  draggedTaskId.value = null
  dropTarget.value = null
}

function isDropIndicatorVisible(status: TodoTaskStatus, index: number) {
  return dropTarget.value?.status === status && dropTarget.value.index === index
}

function isDraggingTask(taskId: string) {
  return draggedTaskId.value === taskId
}

watch(
  () => [props.todoListId, todoListsStore.isLoading, todoListsStore.todoLists] as const,
  () => {
    if (todoListsStore.isLoading) return
    if (!props.todoListId) {
      router.replace({ name: 'DashboardTodo' })
      return
    }
    if (!todoListsStore.todoLists.some((list) => list.id === props.todoListId)) {
      router.replace({ name: 'DashboardTodo' })
    }
  },
  { immediate: true },
)

watch(
  () => [props.todoListId, activePeriod.value] as const,
  ([todoListId, period]) => {
    if (!todoListId) return
    const query = period === 'all' ? {} : { deadlineFilter: period }
    void todoListsStore.fetchTodoListTasks(todoListId, query, { force: true })
  },
  { immediate: true },
)
</script>

<template>
  <section class="isolate flex h-full min-h-0 w-full max-w-[985px] flex-col">
    <header
      class="sticky top-0 z-10 mb-[35px] shrink-0 -mx-1 bg-black px-1 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.45)]"
    >
      <div class="flex items-center justify-between gap-4">
        <div class="flex h-[22px] items-center gap-[30px]">
          <button
            v-for="option in periodOptions"
            :key="option.id"
            type="button"
            class="rounded-[10px] px-[30px] py-1 text-[12px] font-medium tracking-[-0.132px] transition-colors"
            :class="
              activePeriod === option.id
                ? 'bg-white text-black'
                : 'text-white/50 hover:text-white/70'
            "
            @click="activePeriod = option.id"
          >
            {{ option.label }}
          </button>
        </div>
        <div class="h-[28px] w-[203px] shrink-0">
          <BaseButton
            text="Add task"
            class="h-[28px]! rounded-[10px]! px-[34px]! py-[5px]! font-medium! text-[12px]! leading-[150%]!"
            @click="handleAddTask"
          />
        </div>
      </div>
    </header>

    <div
      v-if="todoListsStore.tasksLoading"
      class="flex min-h-0 flex-1 items-center justify-center text-sm text-white/50"
    >
      Loading tasks...
    </div>

    <p
      v-else-if="todoListsStore.tasksError"
      class="text-sm font-medium text-red-400"
    >
      {{ todoListsStore.tasksError }}
    </p>

    <div
      v-else
      class="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div class="grid w-full max-w-[985px] grid-cols-3 gap-5">
        <div
          v-for="column in columns"
          :key="column.status"
          class="flex min-w-0 flex-col"
        >
          <h2
            class="sticky top-0 z-[1] mb-5 bg-black pb-2 text-[16px] font-semibold tracking-[-0.176px] text-white"
          >
            {{ column.label }}
            <span :style="{ color: column.countColor }">
              ({{ columnCount(column.status) }})
            </span>
          </h2>
          <div
            class="flex min-h-[127px] flex-col gap-5"
            @dragover="onColumnDragOver($event, column.status)"
            @drop.prevent="onDrop(column.status, tasksForColumn(column.status).length)"
          >
            <template
              v-for="(task, index) in tasksForColumn(column.status)"
              :key="task.id"
            >
              <div
                v-if="isDropIndicatorVisible(column.status, index)"
                class="h-[3px] shrink-0 rounded-full bg-white/70"
                aria-hidden="true"
              />
              <article
                draggable="true"
                class="relative h-[127px] w-full cursor-grab overflow-hidden rounded-[10px] bg-gradient-to-b from-[#343434] to-[#161616] transition-opacity active:cursor-grabbing"
                :class="{ 'opacity-40': isDraggingTask(task.id) }"
                @dragstart="onDragStart($event, task)"
                @dragend="onDragEnd"
                @dragover="onTaskDragOver($event, column.status, index)"
                @drop.prevent="onDrop(column.status, getInsertIndex($event, index))"
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
            <div
              v-if="isDropIndicatorVisible(column.status, tasksForColumn(column.status).length)"
              class="h-[3px] shrink-0 rounded-full bg-white/70"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>

    <div
      class="pointer-events-none sticky bottom-0 z-[1px] h-[2px] w-full bg-black shadow-[0_-3px_10px_-1px_rgba(0,0,0,0.35)]"
      aria-hidden="true"
    />

    <AddTaskPopup v-model="showAddTaskPopup" :todo-list-id="todoListId" />
  </section>
</template>
