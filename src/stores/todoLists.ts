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
    },

    async createTodoList(
      workspaceId: string,
      payload: { name: string; description?: string; color: string }
    ) {
      const trimmedName = payload.name.trim()
      if (!workspaceId) {
        throw new Error('No workspace selected.')
      }
      if (!trimmedName) {
        throw new Error('Enter a todo list name.')
      }

      const colorRaw = payload.color.trim().replace(/^#/, '')
      if (!/^[0-9A-Fa-f]{6}$/.test(colorRaw)) {
        throw new Error('Invalid color.')
      }
      const color = colorRaw.toUpperCase()

      try {
        const response = await api.post<ApiSuccess<TodoList>>(
          `/workspaces/${workspaceId}/todo-lists`,
          {
            name: trimmedName,
            description: (payload.description ?? '').trim(),
            color
          }
        )
        const envelope = response.data
        if (!envelope?.success) {
          throw new Error(envelope?.message || 'Failed to create todo list.')
        }
        this.todoLists = [...this.todoLists, envelope.data]
        return envelope.data
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'response' in error) {
          const data = (error as { response?: { data?: { message?: string } } })
            .response?.data
          if (data?.message) {
            throw new Error(data.message)
          }
        }
        if (error instanceof Error) throw error
        throw new Error('Failed to create todo list.')
      }
    }
  }
})
