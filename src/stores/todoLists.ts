import { defineStore } from 'pinia'
import api from '@/api'
import { useWorkspaceStore } from '@/stores/workspace'
import type { ApiSuccess, PaginationMeta } from '@/types/api'

function resolveWorkspaceId(storeLoadedId: string | null): string | null {
  const activeId = useWorkspaceStore().activeWorkspace?.id ?? null
  return activeId ?? storeLoadedId
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const res = (error as { response?: { status?: number; data?: { message?: string } } })
      .response
    if (res?.data?.message) return res.data.message
    if (res?.status === 404) {
      return 'Todo list not found. It may have been deleted already.'
    }
  }
  if (error instanceof Error) return error.message
  return fallback
}

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
    },

    async updateTodoList(
      todoListId: string,
      payload: {
        name: string
        description: string
        color: string
        originalName: string
        originalDescription: string | null
        originalColor: string | null
      }
    ) {
      const trimmedName = payload.name.trim()
      if (!todoListId) {
        throw new Error('Todo list not found')
      }
      if (!trimmedName) {
        throw new Error('Enter a todo list name.')
      }

      const workspaceId = resolveWorkspaceId(this.loadedWorkspaceId)
      if (!workspaceId) {
        throw new Error('No workspace selected')
      }

      const trimmedDescription = payload.description.trim()
      const normalizedOriginalDescription = (payload.originalDescription ?? '').trim()

      const colorRaw = payload.color.trim().replace(/^#/, '')
      if (!/^[0-9A-Fa-f]{6}$/.test(colorRaw)) {
        throw new Error('Invalid color.')
      }
      const color = colorRaw.toUpperCase()

      const originalColorRaw = (payload.originalColor ?? '')
        .trim()
        .replace(/^#/, '')
        .toUpperCase()

      const body: { name: string; description?: string; color?: string } = {
        name: trimmedName
      }

      if (trimmedDescription !== normalizedOriginalDescription) {
        body.description = trimmedDescription
      }

      if (color !== originalColorRaw) {
        body.color = color
      }

      try {
        const response = await api.patch<ApiSuccess<TodoList>>(
          `/todo-lists/${todoListId}`,
          body
        )
        const result = response.data
        if (!result?.success) {
          throw new Error(result?.message || 'Failed to update todo list')
        }
        await this.fetchTodoLists(workspaceId)
        return result.data
      } catch (error: unknown) {
        throw new Error(getApiErrorMessage(error, 'Failed to update todo list'))
      }
    },

    async deleteTodoList(todoListId: string) {
      if (!todoListId) {
        throw new Error('Todo list not found')
      }

      const workspaceId = resolveWorkspaceId(this.loadedWorkspaceId)
      if (!workspaceId) {
        throw new Error('No workspace selected')
      }

      const todoList = this.todoLists.find((list) => list.id === todoListId)
      if (todoList && todoList.workspaceId !== workspaceId) {
        await this.fetchTodoLists(workspaceId)
        throw new Error('This todo list is not in the current workspace.')
      }

      try {
        const response = await api.delete(`/todo-lists/${todoListId}`)
        const { status, data } = response
        const payload = data as ApiSuccess<null> | undefined

        const isHttpSuccess = status >= 200 && status < 300
        const isJsonFailure =
          payload &&
          typeof payload === 'object' &&
          'success' in payload &&
          payload.success === false

        if (!isHttpSuccess || isJsonFailure) {
          throw new Error(
            (payload && typeof payload === 'object' && payload.message) ||
              'Failed to delete todo list'
          )
        }

        await this.fetchTodoLists(workspaceId)
      } catch (error: unknown) {
        const status =
          error &&
          typeof error === 'object' &&
          'response' in error &&
          (error as { response?: { status?: number } }).response?.status

        if (status === 404) {
          await this.fetchTodoLists(workspaceId)
        }

        throw new Error(getApiErrorMessage(error, 'Failed to delete todo list'))
      }
    }
  }
})
