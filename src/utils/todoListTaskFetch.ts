import { listTodoListTasks } from '@/api/todoLists'
import type { TodoTask } from '@/stores/types/todoLists.types'

export async function fetchAllTodoListTasks(todoListId: string): Promise<TodoTask[]> {
  const allTasks: TodoTask[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const response = await listTodoListTasks(todoListId, {
      page,
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'asc',
    })
    const payload = response.data
    if (!payload?.success) {
      throw new Error(payload?.message || 'Failed to fetch tasks')
    }

    allTasks.push(...payload.data)
    totalPages = payload.meta?.totalPages ?? 1
    page += 1
  }

  return allTasks
}
