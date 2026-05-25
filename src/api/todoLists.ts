import api from '@/api'
import type { ApiSuccess } from '@/types/api'
import type { TodoList } from '@/stores/todoLists'

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
