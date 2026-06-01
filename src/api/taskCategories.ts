import api from '@/api'
import type { ApiSuccess } from '@/types/api'

export interface TaskCategory {
  id: string
  workspaceId: string
  todoListId: string | null
  name: string
  color: string
  createdAt: string
  updatedAt: string
}

export function listTaskCategories(workspaceId: string, params?: { search?: string }) {
  return api.get<ApiSuccess<TaskCategory[]>>(`/workspaces/${workspaceId}/task-categories`, {
    params,
  })
}

export function createTaskCategory(
  workspaceId: string,
  body: { name: string; color: string; todoListId?: string | null },
) {
  return api.post<ApiSuccess<TaskCategory>>(
    `/workspaces/${workspaceId}/task-categories`,
    body,
  )
}
