export interface TodoList {
  id: string
  workspaceId: string
  name: string
  description: string | null
  color: string | null
  createdById: string
  createdAt: string
  updatedAt: string
}

export type TodoTaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

export interface TodoTask {
  id: string
  todoListId: string
  categoryId: string | null
  title: string
  description: string | null
  status: TodoTaskStatus
  deadlineAt: string | null
  position: number
  createdAt: string
  updatedAt: string
}
