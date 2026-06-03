import api from '@/api'
import type { ApiSuccess } from '@/types/api'
import type { TodoList, TodoTask, TodoTaskStatus } from '@/stores/todoLists'

export interface TodoListsQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function listTodoLists(workspaceId: string, params: TodoListsQuery) {
  return api.get<ApiSuccess<TodoList[]>>(`/workspaces/${workspaceId}/todo-lists`, {
    params,
  })
}

export function createTodoList(
  workspaceId: string,
  body: { name: string; description: string; color: string },
) {
  return api.post<ApiSuccess<TodoList>>(`/workspaces/${workspaceId}/todo-lists`, body)
}

export function updateTodoList(
  todoListId: string,
  body: { name: string; description?: string; color?: string },
) {
  return api.patch<ApiSuccess<TodoList>>(`/todo-lists/${todoListId}`, body)
}

export function deleteTodoList(todoListId: string) {
  return api.delete(`/todo-lists/${todoListId}`)
}

export interface TodoTasksQuery {
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'deadlineAt'
  sortOrder?: 'asc' | 'desc'
  search?: string
  deadlineFilter?: 'today' | 'week' | 'month'
}

export interface CreateTodoTaskBody {
  title: string
  description?: string | null
  categoryId?: string | null
  status?: TodoTaskStatus
  deadlineAt?: string | null
}

export function listTodoListTasks(todoListId: string, params?: TodoTasksQuery) {
  return api.get<ApiSuccess<TodoTask[]>>(`/todo-lists/${todoListId}/tasks`, {
    params,
  })
}

export function createTodoListTask(todoListId: string, body: CreateTodoTaskBody) {
  return api.post<ApiSuccess<TodoTask>>(`/todo-lists/${todoListId}/tasks`, body)
}

export interface UpdateTodoTaskPositionBody {
  afterId: string | null
  beforeId: string | null
  status?: TodoTaskStatus
}

function normalizeNeighborId(value: string | null | undefined): string | null {
  if (value == null || value === '') return null
  return value
}

function normalizeTaskId(taskId: string): string {
  const match = taskId.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  )
  if (!match) {
    throw new Error('Invalid task id')
  }
  return match[0]
}

/** PATCH /tasks/{taskId}/position — only afterId, beforeId, optional status (never position index). */
export function updateTodoTaskPosition(
  taskId: string,
  body: UpdateTodoTaskPositionBody,
) {
  const id = normalizeTaskId(taskId)
  const payload: UpdateTodoTaskPositionBody = {
    afterId: normalizeNeighborId(body.afterId),
    beforeId: normalizeNeighborId(body.beforeId),
  }
  if (body.status) {
    payload.status = body.status
  }
  return api.patch<ApiSuccess<TodoTask>>(`/tasks/${id}/position`, payload)
}
