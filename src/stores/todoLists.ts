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

function sortTasksByPosition(tasks: TodoTask[]): TodoTask[] {
  return [...tasks].sort((a, b) => a.position - b.position)
}

function columnTasksForStatus(
  tasks: TodoTask[],
  status: TodoTaskStatus,
  excludeTaskId?: string,
): TodoTask[] {
  return sortTasksByPosition(
    tasks.filter((item) => item.status === status && item.id !== excludeTaskId),
  )
}

/** API requires no other task in the list between afterId and beforeId (any status). */
function areGloballyAdjacent(
  allTasks: TodoTask[],
  afterId: string,
  beforeId: string,
): boolean {
  const after = allTasks.find((item) => item.id === afterId)
  const before = allTasks.find((item) => item.id === beforeId)
  if (!after || !before) return false

  const minPos = Math.min(after.position, before.position)
  const maxPos = Math.max(after.position, before.position)

  return !allTasks.some(
    (item) =>
      item.id !== afterId &&
      item.id !== beforeId &&
      item.position > minPos &&
      item.position < maxPos,
  )
}

function collapseNonAdjacentNeighbors(
  allTasks: TodoTask[],
  payload: { afterId: string | null; beforeId: string | null },
): { afterId: string | null; beforeId: string | null } {
  if (!payload.afterId || !payload.beforeId) return payload
  if (areGloballyAdjacent(allTasks, payload.afterId, payload.beforeId)) {
    return payload
  }
  return { afterId: payload.afterId, beforeId: null }
}

/** Map UI drop index (TodoListPage) to insert index in server column without dragged task. */
function resolveServerInsertIndex(
  allTasks: TodoTask[],
  visibleTasks: TodoTask[],
  taskId: string,
  fromStatus: TodoTaskStatus,
  toStatus: TodoTaskStatus,
  toIndex: number,
): number {
  const columnTasks = columnTasksForStatus(allTasks, toStatus, taskId)
  const fullColumn = sortTasksByPosition(
    allTasks.filter((item) => item.status === toStatus),
  )
  const visibleColumn = sortTasksByPosition(
    visibleTasks.filter((item) => item.status === toStatus),
  )

  let insertBeforeId: string | null = null
  if (toIndex < visibleColumn.length) {
    insertBeforeId = visibleColumn[toIndex].id
    if (insertBeforeId === taskId) {
      insertBeforeId = visibleColumn[toIndex + 1]?.id ?? null
    }
  }

  if (!insertBeforeId) {
    return columnTasks.length
  }

  let insertIndex = fullColumn.findIndex((item) => item.id === insertBeforeId)
  if (insertIndex === -1) {
    return columnTasks.length
  }

  if (fromStatus === toStatus) {
    const sourceIndex = fullColumn.findIndex((item) => item.id === taskId)
    if (sourceIndex !== -1 && sourceIndex < insertIndex) {
      insertIndex -= 1
    }
  }

  return Math.max(0, Math.min(insertIndex, columnTasks.length))
}

/** Build afterId/beforeId from server-ordered column (afterId.position < beforeId.position). */
function buildTaskPositionPayloadFromTasks(
  allTasks: TodoTask[],
  visibleTasks: TodoTask[],
  taskId: string,
  fromStatus: TodoTaskStatus,
  toStatus: TodoTaskStatus,
  toIndex: number,
): { afterId: string | null; beforeId: string | null; status?: TodoTaskStatus } {
  const columnTasks = columnTasksForStatus(allTasks, toStatus, taskId)
  const withStatus = (payload: {
    afterId: string | null
    beforeId: string | null
  }): { afterId: string | null; beforeId: string | null; status?: TodoTaskStatus } =>
    toStatus !== fromStatus ? { ...payload, status: toStatus } : payload

  if (columnTasks.length === 0) {
    return withStatus({ afterId: null, beforeId: null })
  }

  const insertIndex = resolveServerInsertIndex(
    allTasks,
    visibleTasks,
    taskId,
    fromStatus,
    toStatus,
    toIndex,
  )

  if (insertIndex <= 0) {
    return withStatus(
      collapseNonAdjacentNeighbors(allTasks, {
        afterId: null,
        beforeId: columnTasks[0].id,
      }),
    )
  }

  if (insertIndex >= columnTasks.length) {
    return withStatus(
      collapseNonAdjacentNeighbors(allTasks, {
        afterId: columnTasks[columnTasks.length - 1].id,
        beforeId: null,
      }),
    )
  }

  return withStatus(
    collapseNonAdjacentNeighbors(allTasks, {
      afterId: columnTasks[insertIndex - 1].id,
      beforeId: columnTasks[insertIndex].id,
    }),
  )
}

async function fetchAllTodoListTasks(todoListId: string): Promise<TodoTask[]> {
  const response = await listTodoListTasks(todoListId, {
    page: 1,
    limit: 100,
    sortBy: 'createdAt',
    sortOrder: 'asc',
  })
  const payload = response.data
  if (!payload?.success) {
    throw new Error(payload?.message || 'Failed to fetch tasks')
  }
  return payload.data
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
      const task = this.tasks.find((item) => item.id === taskId)
      if (!task) return

      const todoListId = this.tasksTodoListId ?? task.todoListId
      if (!todoListId) return

      const previousTasks = this.tasks.map((item) => ({ ...item }))
      const visibleSnapshot = this.tasks.map((item) => ({ ...item }))

      this.moveTaskLocally(taskId, toStatus, toIndex)

      try {
        const allTasks = await fetchAllTodoListTasks(todoListId)
        const positionBody = this.buildTaskPositionPayload(
          taskId,
          task.status,
          toStatus,
          toIndex,
          allTasks,
          visibleSnapshot,
        )

        const response = await updateTodoTaskPosition(taskId, positionBody)
        const envelope = response.data
        if (!envelope?.success) {
          throw new Error(envelope?.message || 'Failed to move task.')
        }

        const query: TodoTasksQuery = this.tasksDeadlineFilter
          ? { deadlineFilter: this.tasksDeadlineFilter }
          : {}
        await this.fetchTodoListTasks(todoListId, query, {
          force: true,
          silent: true,
        })
      } catch {
        this.tasks = previousTasks
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
