<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import AddTaskPopup from '@/components/dashboard/AddTaskPopup.vue'
import { useTodoListsStore, type TodoTask, type TodoTaskStatus } from '@/stores/todoLists'
import {
  getTodoTasksPeriodFilter,
  setTodoTasksPeriodFilter,
  type TodoTasksPeriodFilter,
} from '@/utils/todoTasksPeriodFilter'

type PeriodFilter = TodoTasksPeriodFilter

const props = defineProps<{
  todoListId: string
}>()

const router = useRouter()
const todoListsStore = useTodoListsStore()

const activePeriod = ref<PeriodFilter>(getTodoTasksPeriodFilter())
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
const hideDragSource = ref(false)
const dropTarget = ref<{ status: TodoTaskStatus; index: number } | null>(null)
let dragPreviewEl: HTMLElement | null = null

const dropLineBase =
  'w-full rounded-full transition-[height,background-color,box-shadow,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
const dropLineActive = 'h-px bg-white/70 shadow-[0_0_4px_rgba(255,255,255,0.2)]'
const dropLineHint = 'h-px bg-white/[0.07]'
const dropLineHidden = 'h-px bg-transparent opacity-0'

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

  const source = event.currentTarget as HTMLElement | null
  if (!source || !event.dataTransfer) return

  const rect = source.getBoundingClientRect()
  dragPreviewEl = source.cloneNode(true) as HTMLElement
  dragPreviewEl.style.position = 'fixed'
  dragPreviewEl.style.top = '-9999px'
  dragPreviewEl.style.left = '0'
  dragPreviewEl.style.width = `${rect.width}px`
  dragPreviewEl.style.height = `${rect.height}px`
  dragPreviewEl.style.opacity = '1'
  dragPreviewEl.style.pointerEvents = 'none'
  dragPreviewEl.style.boxShadow = '0 14px 36px rgba(0,0,0,0.5)'
  document.body.appendChild(dragPreviewEl)
  event.dataTransfer.setDragImage(dragPreviewEl, rect.width / 2, rect.height / 2)

  void nextTick(() => {
    hideDragSource.value = true
  })
}

function onDragEnd() {
  dragPreviewEl?.remove()
  dragPreviewEl = null
  hideDragSource.value = false
  draggedTaskId.value = null
  dropTarget.value = null
}

function getColumnEl(event: DragEvent): HTMLElement | null {
  return (event.currentTarget as HTMLElement).closest('.column-drop-zone')
}

function resolveDropIndex(event: DragEvent, status: TodoTaskStatus): number {
  const columnEl = getColumnEl(event)
  if (!columnEl) return 0

  const tasks = tasksForColumn(status)
  if (tasks.length === 0) return 0

  const cards = Array.from(
    columnEl.querySelectorAll<HTMLElement>('[data-task-card]'),
  ).filter((card) => card.dataset.taskId !== draggedTaskId.value)

  if (cards.length === 0) return 0

  const y = event.clientY

  for (const card of cards) {
    const rect = card.getBoundingClientRect()
    if (y < rect.top + rect.height / 2) {
      const taskId = card.dataset.taskId
      const index = tasks.findIndex((task) => task.id === taskId)
      return index === -1 ? 0 : index
    }
  }

  const lastCard = cards[cards.length - 1]
  if (lastCard && y >= lastCard.getBoundingClientRect().bottom - 12) {
    return tasks.length
  }

  return tasks.length
}

function onColumnDragEnter(event: DragEvent) {
  if (!draggedTaskId.value) return
  event.preventDefault()
}

function onColumnDragOver(event: DragEvent, status: TodoTaskStatus) {
  event.preventDefault()
  if (!draggedTaskId.value) return
  event.dataTransfer!.dropEffect = 'move'
  dropTarget.value = { status, index: resolveDropIndex(event, status) }
}

function onColumnDrop(event: DragEvent, status: TodoTaskStatus) {
  event.preventDefault()
  onDrop(status, resolveDropIndex(event, status))
}

function onDrop(status: TodoTaskStatus, index: number) {
  const taskId = draggedTaskId.value
  if (!taskId) return
  draggedTaskId.value = null
  dropTarget.value = null
  void todoListsStore.moveTask(taskId, status, index)
}

function isDropIndicatorVisible(status: TodoTaskStatus, index: number) {
  return dropTarget.value?.status === status && dropTarget.value.index === index
}

function isDropSlotActive(status: TodoTaskStatus, index: number) {
  return isDropIndicatorVisible(status, index)
}

function isDropSlotHintVisible(status: TodoTaskStatus, index: number) {
  return Boolean(draggedTaskId.value) && !isDropSlotActive(status, index)
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

watch(activePeriod, (period) => {
  setTodoTasksPeriodFilter(period)
})

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
  <section class="dashboard-page-column">
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
      class="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div
        class="grid min-h-full w-full flex-1 grid-cols-3 gap-5"
      >
        <div
          v-for="column in columns"
          :key="column.status"
          class="flex min-h-full min-w-0 flex-col"
        >
          <h2
            class="sticky top-0 z-[1] mb-5 shrink-0 bg-black pb-2 text-[16px] font-semibold tracking-[-0.176px] text-white"
          >
            {{ column.label }}
            <span :style="{ color: column.countColor }">
              ({{ columnCount(column.status) }})
            </span>
          </h2>
          <div
            class="column-drop-zone flex min-h-[calc(100dvh-240px)] flex-1 flex-col"
            @dragenter="onColumnDragEnter"
            @dragover="onColumnDragOver($event, column.status)"
            @drop.prevent="onColumnDrop($event, column.status)"
          >
            <div
              v-if="tasksForColumn(column.status).length === 0"
              class="flex h-[20px] shrink-0 items-center px-1"
            >
              <div
                :class="[
                  dropLineBase,
                  isDropSlotActive(column.status, 0)
                    ? dropLineActive
                    : draggedTaskId
                      ? dropLineHint
                      : dropLineHidden,
                ]"
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
                v-for="(task, index) in tasksForColumn(column.status)"
                :key="task.id"
                class="flex flex-col"
              >
                <div class="flex h-[20px] shrink-0 items-center px-1">
                  <div
                    :class="[
                      dropLineBase,
                      isDropSlotActive(column.status, index)
                        ? dropLineActive
                        : isDropSlotHintVisible(column.status, index)
                          ? dropLineHint
                          : dropLineHidden,
                    ]"
                    aria-hidden="true"
                  />
                </div>

                <article
                  draggable="true"
                  data-task-card
                  :data-task-id="task.id"
                  class="relative h-[127px] w-full shrink-0 cursor-grab overflow-hidden rounded-[10px] bg-gradient-to-b from-[#343434] to-[#161616] transition-[opacity,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:cursor-grabbing"
                  :class="{
                    'opacity-0': hideDragSource && isDraggingTask(task.id),
                  }"
                  @dragstart="onDragStart($event, task)"
                  @dragend="onDragEnd"
                  @dragover.prevent="
                    hideDragSource ? onColumnDragOver($event, column.status) : undefined
                  "
                  @drop.prevent="onColumnDrop($event, column.status)"
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
              </div>
            </TransitionGroup>

            <div
              class="column-drop-fill flex min-h-[127px] flex-1 flex-col"
              @dragenter="onColumnDragEnter"
              @dragover="onColumnDragOver($event, column.status)"
              @drop.prevent="onColumnDrop($event, column.status)"
            >
              <div
                v-if="tasksForColumn(column.status).length > 0"
                class="flex h-[20px] shrink-0 items-center px-1"
              >
                <div
                  :class="[
                    dropLineBase,
                    isDropSlotActive(
                      column.status,
                      tasksForColumn(column.status).length,
                    )
                      ? dropLineActive
                      : isDropSlotHintVisible(
                          column.status,
                          tasksForColumn(column.status).length,
                        )
                        ? dropLineHint
                        : dropLineHidden,
                  ]"
                  aria-hidden="true"
                />
              </div>
            </div>
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

<style scoped>
.todo-task-move {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
