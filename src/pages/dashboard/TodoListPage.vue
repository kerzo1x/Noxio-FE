<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import AddTaskPopup from '@/components/dashboard/tasks/AddTaskPopup.vue'
import DashboardBottomFade from '@/components/dashboard/DashboardBottomFade.vue'
import KanbanBoard from '@/components/dashboard/kanban/KanbanBoard.vue'
import { useTodoListsStore } from '@/stores/todoLists'
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
            @click="showAddTaskPopup = true"
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
      <p
        v-if="todoListsStore.taskMoveError"
        class="mb-3 shrink-0 rounded-[10px] border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-200"
      >
        {{ todoListsStore.taskMoveError }}
      </p>
      <KanbanBoard />
    </div>

    <DashboardBottomFade variant="todoList" />

    <AddTaskPopup v-model="showAddTaskPopup" :todo-list-id="todoListId" />
  </section>
</template>
