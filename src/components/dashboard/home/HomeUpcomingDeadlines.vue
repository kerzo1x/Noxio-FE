<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  useUpcomingDeadlines,
  type UpcomingDeadlineRow,
} from '@/composables/useUpcomingDeadlines'

const props = defineProps<{
  rows?: UpcomingDeadlineRow[]
  loading?: boolean
  error?: string | null
}>()

const router = useRouter()

const internal = props.rows === undefined ? useUpcomingDeadlines() : null

const displayRows = computed(() =>
  internal ? internal.rows.value : (props.rows ?? []),
)
const displayLoading = computed(() =>
  internal ? internal.isLoading.value : (props.loading ?? false),
)
const displayError = computed(() =>
  internal ? internal.error.value : (props.error ?? null),
)

function formatDeadlineDate(deadlineAt: string): string {
  const date = new Date(deadlineAt)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
}

function openTodoList(todoListId: string) {
  router.push({
    name: 'DashboardTodoList',
    params: { todoListId },
  })
}
</script>

<template>
  <h2 class="mb-5 text-[20px] font-medium tracking-[-0.011em] text-white">
    Upcoming deadlines
  </h2>

  <div
    class="mb-6 overflow-hidden rounded-[10px] border border-[#161616] bg-[#101010]"
  >
    <div
      class="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.85fr)] gap-4 px-4 py-3.5 text-[10px] font-bold leading-normal text-[#a2a2a2]"
    >
      <span>Name</span>
      <span>Category</span>
      <span>Todo List</span>
      <span class="text-right">Deadline</span>
    </div>

    <div
      class="min-h-[120px] rounded-[10px] border border-[#212121] bg-[#161616]"
    >
      <div
        v-if="displayLoading"
        class="flex min-h-[120px] items-center justify-center px-4 text-sm text-white/50"
      >
        Loading deadlines…
      </div>
      <div
        v-else-if="displayError"
        class="flex min-h-[120px] items-center justify-center px-4 text-center text-sm text-red-400/90"
      >
        {{ displayError }}
      </div>
      <div
        v-else-if="displayRows.length === 0"
        class="flex min-h-[120px] items-center justify-center px-4 text-sm text-white/45"
      >
        No upcoming deadlines this month.
      </div>
      <div v-else class="flex flex-col gap-1 py-2">
        <div
          v-for="row in displayRows"
          :key="row.taskId"
          role="button"
          tabindex="0"
          class="grid cursor-pointer grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.85fr)] gap-4 rounded-[6px] px-4 py-3 text-sm leading-normal text-white transition-colors hover:bg-white/5"
          @click="openTodoList(row.todoListId)"
          @keydown.enter="openTodoList(row.todoListId)"
        >
          <span class="truncate">{{ row.name }}</span>
          <span class="truncate text-white/90">{{ row.category }}</span>
          <span class="truncate text-white/90">{{ row.todoList }}</span>
          <span class="truncate text-right text-white/90">
            {{ formatDeadlineDate(row.deadlineAt) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
