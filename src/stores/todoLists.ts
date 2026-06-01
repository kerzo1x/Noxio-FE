import { defineStore } from 'pinia'
import {
  createTodoList as createTodoListApi,
  createTodoListTask as createTodoListTaskApi,
  deleteTodoList as deleteTodoListApi,
  listTodoListTasks,
  listTodoLists,
  updateTodoList as updateTodoListApi,
  updateTodoTaskPosition,
  type CreateTodoTaskBody,
  type TodoListsQuery,
  type TodoTasksQuery,
} from '@/api/todoLists'
import { useWorkspaceStore } from '@/stores/workspace'
import type { PaginationMeta } from '@/types/api'

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

const defaultQuery: Required<TodoListsQuery> = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'asc',
}

export const useTodoListsStore = defineStore('todo-lists', {
  state: () => ({
    todoLists: [] as TodoList[],
    meta: null as PaginationMeta | null,
    isLoading: false,
    error: null as string | null,
    loadedWorkspaceId: null as string | null,
    tasks: [] as TodoTask[],
    tasksTodoListId: null as string | null,
    tasksLoading: false,
    tasksError: null as string | null,
    tasksDeadlineFilter: null as TodoTasksQuery['deadlineFilter'] | null,
  }),

  actions: {
    reset() {
      this.todoLists = []
      this.meta = null
      this.error = null
      this.isLoading = false
      this.loadedWorkspaceId = null
      this.resetTasks()
    },

    resetTasks() {
      this.tasks = []
      this.tasksTodoListId = null
      this.tasksLoading = false
      this.tasksError = null
      this.tasksDeadlineFilter = null
    },

    async fetchTodoLists(
      workspaceId: string,
      query: TodoListsQuery = {},
      opts?: { force?: boolean },
    ) {
      if (!workspaceId) {
        this.reset()
        return
      }

      if (
        !opts?.force &&
        this.loadedWorkspaceId === workspaceId &&
        !this.error
      ) {
        return
      }

      const params = { ...defaultQuery, ...query }

      this.isLoading = true
      this.error = null

      try {
        const response = await listTodoLists(workspaceId, params)
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
      payload: { name: string; description?: string; color: string },
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
        const response = await createTodoListApi(workspaceId, {
          name: trimmedName,
          description: (payload.description ?? '').trim(),
          color,
        })
        const envelope = response.data
        if (!envelope?.success) {
          throw new Error(envelope?.message || 'Failed to create todo list.')
        }
        if (this.loadedWorkspaceId === workspaceId) {
          this.todoLists = [...this.todoLists, envelope.data]
        }
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
      },
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
        name: trimmedName,
      }

      if (trimmedDescription !== normalizedOriginalDescription) {
        body.description = trimmedDescription
      }

      if (color !== originalColorRaw) {
        body.color = color
      }

      try {
        const response = await updateTodoListApi(todoListId, body)
        const result = response.data
        if (!result?.success) {
          throw new Error(result?.message || 'Failed to update todo list')
        }
        const updated = result.data
        const index = this.todoLists.findIndex((list) => list.id === todoListId)
        if (index !== -1) {
          this.todoLists = [
            ...this.todoLists.slice(0, index),
            updated,
            ...this.todoLists.slice(index + 1),
          ]
        }
        return updated
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
        await this.fetchTodoLists(workspaceId, {}, { force: true })
        throw new Error('This todo list is not in the current workspace.')
      }

      try {
        const response = await deleteTodoListApi(todoListId)
        const { status, data } = response
        const payload = data as { success?: boolean; message?: string } | undefined

        const isHttpSuccess = status >= 200 && status < 300
        const isJsonFailure =
          payload &&
          typeof payload === 'object' &&
          'success' in payload &&
          payload.success === false

        if (!isHttpSuccess || isJsonFailure) {
          throw new Error(
            (payload && typeof payload === 'object' && payload.message) ||
              'Failed to delete todo list',
          )
        }

        this.todoLists = this.todoLists.filter((list) => list.id !== todoListId)
      } catch (error: unknown) {
        const status =
          error &&
          typeof error === 'object' &&
          'response' in error &&
          (error as { response?: { status?: number } }).response?.status

        if (status === 404) {
          this.todoLists = this.todoLists.filter((list) => list.id !== todoListId)
        }

        throw new Error(getApiErrorMessage(error, 'Failed to delete todo list'))
      }
    },

    async fetchTodoListTasks(
      todoListId: string,
      query: TodoTasksQuery = {},
      opts?: { force?: boolean },
    ) {
      if (!todoListId) {
        this.resetTasks()
        return
      }

      const deadlineFilter = query.deadlineFilter ?? null
      if (
        !opts?.force &&
        this.tasksTodoListId === todoListId &&
        this.tasksDeadlineFilter === deadlineFilter &&
        !this.tasksError
      ) {
        return
      }

      this.tasksLoading = true
      this.tasksError = null

      try {
        const response = await listTodoListTasks(todoListId, {
          page: 1,
          limit: 100,
          sortBy: 'createdAt',
          sortOrder: 'asc',
          ...query,
        })
        const payload = response.data

        if (!payload?.success) {
          throw new Error(payload?.message || 'Failed to fetch tasks')
        }

        this.tasks = payload.data
        this.tasksTodoListId = todoListId
        this.tasksDeadlineFilter = deadlineFilter
      } catch (error) {
        this.tasksError =
          error instanceof Error ? error.message : 'Failed to fetch tasks'
        this.tasks = []
        this.tasksTodoListId = null
        this.tasksDeadlineFilter = null
      } finally {
        this.tasksLoading = false
      }
    },

    moveTaskLocally(taskId: string, toStatus: TodoTaskStatus, toIndex: number) {
      const task = this.tasks.find((item) => item.id === taskId)
      if (!task) return

      const grouped: Record<TodoTaskStatus, TodoTask[]> = {
        TODO: [],
        IN_PROGRESS: [],
        DONE: [],
      }

      for (const item of this.tasks) {
        grouped[item.status].push({ ...item })
      }

      for (const status of Object.keys(grouped) as TodoTaskStatus[]) {
        grouped[status].sort((a, b) => a.position - b.position)
      }

      const sourceStatus = task.status
      const sourceList = grouped[sourceStatus]
      const sourceIndex = sourceList.findIndex((item) => item.id === taskId)
      if (sourceIndex === -1) return

      sourceList.splice(sourceIndex, 1)

      let adjustedIndex = toIndex
      if (sourceStatus === toStatus && sourceIndex < toIndex) {
        adjustedIndex -= 1
      }

      const targetList = grouped[toStatus]
      const clampedIndex = Math.max(0, Math.min(adjustedIndex, targetList.length))
      targetList.splice(clampedIndex, 0, { ...task, status: toStatus })

      const updatedTasks: TodoTask[] = []
      for (const status of ['TODO', 'IN_PROGRESS', 'DONE'] as TodoTaskStatus[]) {
        grouped[status].forEach((item, index) => {
          updatedTasks.push({ ...item, status, position: index })
        })
      }

      this.tasks = updatedTasks
    },

    buildTaskPositionPayload(
      taskId: string,
      toStatus: TodoTaskStatus,
      toIndex: number,
    ): { afterId: string | null; beforeId: string | null; status: TodoTaskStatus } {
      const columnTasks = this.tasks
        .filter((item) => item.status === toStatus && item.id !== taskId)
        .sort((a, b) => a.position - b.position)

      if (columnTasks.length === 0) {
        return { afterId: null, beforeId: null, status: toStatus }
      }

      // afterId: neighbor above (lower position); beforeId: neighbor below (higher position)
      if (toIndex <= 0) {
        return { afterId: null, beforeId: columnTasks[0].id, status: toStatus }
      }

      if (toIndex >= columnTasks.length) {
        return {
          afterId: columnTasks[columnTasks.length - 1].id,
          beforeId: null,
          status: toStatus,
        }
      }

      return {
        afterId: columnTasks[toIndex - 1].id,
        beforeId: columnTasks[toIndex].id,
        status: toStatus,
      }
    },

    async moveTask(taskId: string, toStatus: TodoTaskStatus, toIndex: number) {
      const task = this.tasks.find((item) => item.id === taskId)
      if (!task) return

      const previousTasks = this.tasks.map((item) => ({ ...item }))
      const positionBody = this.buildTaskPositionPayload(taskId, toStatus, toIndex)

      this.moveTaskLocally(taskId, toStatus, toIndex)

      try {
        const response = await updateTodoTaskPosition(taskId, positionBody)
        const envelope = response.data
        if (!envelope?.success) {
          throw new Error(envelope?.message || 'Failed to move task.')
        }

        const updated = envelope.data
        const index = this.tasks.findIndex((item) => item.id === taskId)
        if (index !== -1) {
          const { position, status } = this.tasks[index]
          this.tasks = [
            ...this.tasks.slice(0, index),
            { ...updated, position, status },
            ...this.tasks.slice(index + 1),
          ]
        }
      } catch (error: unknown) {
        this.tasks = previousTasks
        this.tasksError = getApiErrorMessage(error, 'Failed to move task.')
      }
    },

    async createTodoTask(
      todoListId: string,
      payload: {
        title: string
        description?: string
        categoryId?: string | null
        deadlineAt?: string | null
        status?: TodoTaskStatus
      },
    ) {
      const trimmedTitle = payload.title.trim()
      if (!todoListId) {
        throw new Error('Todo list not found.')
      }
      if (!trimmedTitle) {
        throw new Error('Enter a task name.')
      }

      const body: CreateTodoTaskBody = {
        title: trimmedTitle,
        status: payload.status ?? 'TODO',
      }

      const trimmedDescription = (payload.description ?? '').trim()
      if (trimmedDescription) {
        body.description = trimmedDescription
      }

      const categoryId = (payload.categoryId ?? '').trim()
      if (categoryId) {
        body.categoryId = categoryId
      }

      if (payload.deadlineAt) {
        body.deadlineAt = payload.deadlineAt
      }

      try {
        const response = await createTodoListTaskApi(todoListId, body)
        const envelope = response.data
        if (!envelope?.success) {
          throw new Error(envelope?.message || 'Failed to create task.')
        }

        const created = envelope.data
        if (this.tasksTodoListId === todoListId) {
          this.tasks = [...this.tasks, created]
        }
        return created
      } catch (error: unknown) {
        throw new Error(getApiErrorMessage(error, 'Failed to create task.'))
      }
    },
  },
})
