import { defineStore } from 'pinia'
import {
  createTodoList as createTodoListApi,
  createTodoListTask as createTodoListTaskApi,
  deleteTodoList as deleteTodoListApi,
  listTodoListTasks,
  listTodoLists,
  updateTodoList as updateTodoListApi,
  type CreateTodoTaskBody,
  type TodoListsQuery,
  type TodoTasksQuery,
} from '@/api/todoLists'
import type { PaginationMeta } from '@/types/api'
import type { TodoList, TodoTask, TodoTaskStatus } from '@/stores/types/todoLists.types'
import { fetchAllTodoListTasks } from '@/utils/todoListTaskFetch'
import { tryTaskPositionPayloads } from '@/utils/todoTaskMove'
import {
  buildTaskPositionFallbacks,
  buildTaskPositionPayloadFromTasks,
} from '@/utils/todoTaskPosition'
import { isInvalidTaskPositionError, unwrapCaught } from '@/types/errors'
import { getApiErrorMessage, resolveWorkspaceId } from '@/utils/storeHelpers'

export type { TodoList, TodoTask, TodoTaskStatus } from '@/stores/types/todoLists.types'

const todoListNotFoundMessage =
  'Todo list not found. It may have been deleted already.'

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
    taskMoveInFlight: false,
    taskMoveError: null as string | null,
    allTasksCache: [] as TodoTask[],
    allTasksCacheTodoListId: null as string | null,
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
      this.taskMoveError = null
      this.allTasksCache = []
      this.allTasksCacheTodoListId = null
    },

    async ensureAllTasksCache(todoListId: string) {
      if (!todoListId) return
      if (this.allTasksCacheTodoListId === todoListId && this.allTasksCache.length > 0) {
        return
      }

      const allTasks = await fetchAllTodoListTasks(todoListId)
      this.allTasksCache = allTasks
      this.allTasksCacheTodoListId = todoListId
    },

    resolveAllTasksForPosition(todoListId: string): TodoTask[] {
      if (this.allTasksCacheTodoListId === todoListId && this.allTasksCache.length > 0) {
        return this.allTasksCache.map((item) => ({ ...item }))
      }
      return []
    },

    syncMovedTaskInCache(updatedTask: TodoTask) {
      if (this.allTasksCacheTodoListId !== updatedTask.todoListId) return

      const index = this.allTasksCache.findIndex((item) => item.id === updatedTask.id)
      if (index === -1) {
        this.allTasksCache.push({ ...updatedTask })
        return
      }

      this.allTasksCache[index] = { ...this.allTasksCache[index], ...updatedTask }
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
      } catch (caught) {
        const error = unwrapCaught(caught)
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
      } catch (caught) {
        const error = unwrapCaught(caught)
        throw new Error(
          getApiErrorMessage(error, 'Failed to update todo list', todoListNotFoundMessage),
        )
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
      } catch (caught) {
        const error = unwrapCaught(caught)
        const status =
          error &&
          typeof error === 'object' &&
          'response' in error &&
          (error as { response?: { status?: number } }).response?.status

        if (status === 404) {
          this.todoLists = this.todoLists.filter((list) => list.id !== todoListId)
        }

        throw new Error(
          getApiErrorMessage(error, 'Failed to delete todo list', todoListNotFoundMessage),
        )
      }
    },

    async fetchTodoListTasks(
      todoListId: string,
      query: TodoTasksQuery = {},
      opts?: { force?: boolean; silent?: boolean },
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

      if (!opts?.silent) {
        this.tasksLoading = true
      }
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

        void this.ensureAllTasksCache(todoListId)
      } catch (error) {
        this.tasksError =
          error instanceof Error ? error.message : 'Failed to fetch tasks'
        this.tasks = []
        this.tasksTodoListId = null
        this.tasksDeadlineFilter = null
      } finally {
        if (!opts?.silent) {
          this.tasksLoading = false
        }
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
      fromStatus: TodoTaskStatus,
      toStatus: TodoTaskStatus,
      toIndex: number,
      allTasks: TodoTask[],
      visibleTasks: TodoTask[],
    ): { afterId: string | null; beforeId: string | null; status?: TodoTaskStatus } {
      return buildTaskPositionPayloadFromTasks(
        allTasks,
        visibleTasks,
        taskId,
        fromStatus,
        toStatus,
        toIndex,
      )
    },

    async moveTask(taskId: string, toStatus: TodoTaskStatus, toIndex: number) {
      if (this.taskMoveInFlight) return

      const task = this.tasks.find((item) => item.id === taskId)
      if (!task) return

      const todoListId = this.tasksTodoListId ?? task.todoListId
      if (!todoListId) return

      const previousTasks = this.tasks.map((item) => ({ ...item }))
      const visibleSnapshot = this.tasks.map((item) => ({ ...item }))

      this.moveTaskLocally(taskId, toStatus, toIndex)
      this.taskMoveInFlight = true
      this.taskMoveError = null

      const fromStatus = task.status

      try {
        const updatedTask = await this.commitTaskPositionUpdate(
          taskId,
          todoListId,
          fromStatus,
          toStatus,
          toIndex,
          visibleSnapshot,
        )
        this.syncMovedTaskInCache(updatedTask)
      } catch (caught) {
        this.tasks = previousTasks
        const error = unwrapCaught(caught)
        if (isInvalidTaskPositionError(error)) {
          this.taskMoveError = `Could not move "${task.title}". This task likely has corrupted position data on the server — try recreating it or ask the backend team to fix its position.`
        }
      } finally {
        this.taskMoveInFlight = false
      }
    },

    async commitTaskPositionUpdate(
      taskId: string,
      todoListId: string,
      fromStatus: TodoTaskStatus,
      toStatus: TodoTaskStatus,
      toIndex: number,
      visibleSnapshot: TodoTask[],
    ): Promise<TodoTask> {
      const runAttempt = async (allTasks: TodoTask[]) => {
        const payloads = buildTaskPositionFallbacks(
          allTasks,
          visibleSnapshot,
          taskId,
          fromStatus,
          toStatus,
          toIndex,
        )
        return tryTaskPositionPayloads(taskId, payloads)
      }

      await this.ensureAllTasksCache(todoListId)
      let allTasks = this.resolveAllTasksForPosition(todoListId)
      if (allTasks.length === 0) {
        allTasks = visibleSnapshot
      }

      try {
        return await runAttempt(allTasks)
      } catch (first) {
        if (!isInvalidTaskPositionError(unwrapCaught(first))) {
          throw first
        }

        this.allTasksCache = []
        this.allTasksCacheTodoListId = null
        await this.ensureAllTasksCache(todoListId)
        allTasks = this.resolveAllTasksForPosition(todoListId)
        if (allTasks.length === 0) {
          allTasks = visibleSnapshot
        }
        return runAttempt(allTasks)
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
      } catch (caught) {
        const error = unwrapCaught(caught)
        throw new Error(getApiErrorMessage(error, 'Failed to create task.'))
      }
    },
  },
})
