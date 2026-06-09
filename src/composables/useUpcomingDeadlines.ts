import { ref, watch } from 'vue'
import { listTaskCategories } from '@/api/taskCategories'
import { listTodoListTasks } from '@/api/todoLists'
import { useTodoListsStore, type TodoTask } from '@/stores/todoLists'
import { useWorkspaceStore } from '@/stores/workspace'

export const UPCOMING_DEADLINES_LIMIT = 50
export const UPCOMING_TASKS_FETCH_LIMIT = 100

export interface UpcomingDeadlineRow {
  taskId: string
  todoListId: string
  name: string
  category: string
  todoList: string
  deadlineAt: string
}

function resolveCategoryName(
  categoryId: string | null,
  categoryById: Map<string, string>,
): string {
  if (!categoryId) return '—'
  return categoryById.get(categoryId) ?? categoryId
}

function isUpcomingTask(task: TodoTask, startOfToday: Date): boolean {
  if (!task.deadlineAt || task.status === 'DONE') return false
  const deadline = new Date(task.deadlineAt)
  return !Number.isNaN(deadline.getTime()) && deadline >= startOfToday
}

export function useUpcomingDeadlines() {
  const workspaceStore = useWorkspaceStore()
  const todoListsStore = useTodoListsStore()

  const rows = ref<UpcomingDeadlineRow[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchDeadlines(workspaceId: string) {
    isLoading.value = true
    error.value = null

    try {
      const lists = todoListsStore.todoLists.filter(
        (list) => list.workspaceId === workspaceId,
      )

      if (lists.length === 0) {
        rows.value = []
        return
      }

      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)

      const [categoriesResponse, ...taskResponses] = await Promise.all([
        listTaskCategories(workspaceId),
        ...lists.map((list) =>
          listTodoListTasks(list.id, {
            page: 1,
            limit: UPCOMING_TASKS_FETCH_LIMIT,
            sortBy: 'deadlineAt',
            sortOrder: 'asc',
            deadlineFilter: 'month',
          }),
        ),
      ])

      const categoriesPayload = categoriesResponse.data
      const categoryById = new Map<string, string>()
      if (categoriesPayload?.success) {
        for (const category of categoriesPayload.data) {
          categoryById.set(category.id, category.name)
        }
      }

      const listById = new Map(lists.map((list) => [list.id, list.name]))
      const merged: UpcomingDeadlineRow[] = []

      for (let index = 0; index < lists.length; index += 1) {
        const list = lists[index]
        const payload = taskResponses[index]?.data
        if (!payload?.success) continue

        for (const task of payload.data) {
          if (!isUpcomingTask(task, startOfToday)) continue

          merged.push({
            taskId: task.id,
            todoListId: task.todoListId,
            name: task.title,
            category: resolveCategoryName(task.categoryId, categoryById),
            todoList: listById.get(list.id) ?? '—',
            deadlineAt: task.deadlineAt!,
          })
        }
      }

      merged.sort(
        (a, b) => new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime(),
      )
      rows.value = merged.slice(0, UPCOMING_DEADLINES_LIMIT)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to load upcoming deadlines'
      rows.value = []
    } finally {
      isLoading.value = false
    }
  }

  watch(
    () =>
      [
        workspaceStore.activeWorkspace?.id ?? null,
        todoListsStore.loadedWorkspaceId,
        todoListsStore.todoLists.length,
      ] as const,
    ([workspaceId]) => {
      if (!workspaceId) {
        rows.value = []
        error.value = null
        return
      }
      if (todoListsStore.loadedWorkspaceId !== workspaceId) return
      void fetchDeadlines(workspaceId)
    },
    { immediate: true },
  )

  return { rows, isLoading, error }
}
