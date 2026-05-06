import { defineStore } from 'pinia'
import api from '@/api'
import type { ApiSuccess, PaginationMeta } from '@/types/api'

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

interface TodoListsQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

const defaultQuery: Required<TodoListsQuery> = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'asc'
}

export const useTodoListsStore = defineStore('todo-lists', {
  state: () => ({
    todoLists: [] as TodoList[],
    meta: null as PaginationMeta | null,
    isLoading: false,
    error: null as string | null,
    loadedWorkspaceId: null as string | null
  }),

  actions: {
    reset() {
      this.todoLists = []
      this.meta = null
      this.error = null
      this.isLoading = false
      this.loadedWorkspaceId = null
    },

    async fetchTodoLists(workspaceId: string, query: TodoListsQuery = {}) {
      if (!workspaceId) {
        this.reset()
        return
      }

      const params = { ...defaultQuery, ...query }

      this.isLoading = true
      this.error = null

      try {
        const response = await api.get<ApiSuccess<TodoList[]>>(
          `/workspaces/${workspaceId}/todo-lists`,
          { params }
        )
        const payload = response.data

        if (!payload?.success) {
          throw new Error(payload?.message || 'Failed to fetch todo lists')
        }

        this.todoLists = payload.data
        this.meta = payload.meta ?? null
        this.loadedWorkspaceId = workspaceId
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : 'Failed to fetch todo lists'
        this.todoLists = []
        this.meta = null
        this.loadedWorkspaceId = null
      } finally {
        this.isLoading = false
      }
    }
  }
})
