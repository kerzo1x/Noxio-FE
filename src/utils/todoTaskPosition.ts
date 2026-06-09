import type { TodoTask, TodoTaskStatus } from '@/stores/todoLists'

function compareTasksByPosition(a: TodoTask, b: TodoTask): number {
  if (a.position !== b.position) {
    return a.position - b.position
  }
  const createdAtCompare = a.createdAt.localeCompare(b.createdAt)
  if (createdAtCompare !== 0) {
    return createdAtCompare
  }
  return a.id.localeCompare(b.id)
}

function sortTasksByPosition(tasks: TodoTask[]): TodoTask[] {
  return [...tasks].sort(compareTasksByPosition)
}

function columnTasksForStatus(
  tasks: TodoTask[],
  status: TodoTaskStatus,
  excludeTaskId?: string,
): TodoTask[] {
  const filtered: TodoTask[] = []
  for (let i = 0; i < tasks.length; i++) {
    const item = tasks[i]
    if (item.status === status && item.id !== excludeTaskId) {
      filtered.push(item)
    }
  }
  return sortTasksByPosition(filtered)
}

/** Backend accepts only one anchor unless both tasks are column-adjacent; prefer a single id. */
function toSingleAnchorPayload(payload: {
  afterId: string | null
  beforeId: string | null
}): { afterId: string | null; beforeId: string | null } {
  if (payload.afterId && payload.beforeId) {
    return { afterId: payload.afterId, beforeId: null }
  }
  return payload
}

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

  if (insertIndex < 0) return 0
  if (insertIndex > columnTasks.length) return columnTasks.length
  return insertIndex
}

export function buildTaskPositionPayloadFromTasks(
  allTasks: TodoTask[],
  visibleTasks: TodoTask[],
  taskId: string,
  fromStatus: TodoTaskStatus,
  toStatus: TodoTaskStatus,
  toIndex: number,
): { afterId: string | null; beforeId: string | null; status?: TodoTaskStatus } {
  const columnTasks = columnTasksForStatus(allTasks, toStatus, taskId)

  function withStatus(payload: {
    afterId: string | null
    beforeId: string | null
  }): { afterId: string | null; beforeId: string | null; status?: TodoTaskStatus } {
    const anchored = toSingleAnchorPayload(payload)
    if (toStatus !== fromStatus) {
      return { ...anchored, status: toStatus }
    }
    return anchored
  }

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
    return withStatus({
      afterId: null,
      beforeId: columnTasks[0].id,
    })
  }

  if (insertIndex >= columnTasks.length) {
    return withStatus({
      afterId: columnTasks[columnTasks.length - 1].id,
      beforeId: null,
    })
  }

  return withStatus({
    afterId: columnTasks[insertIndex - 1].id,
    beforeId: null,
  })
}

export interface TaskPositionPayload {
  afterId: string | null
  beforeId: string | null
  status?: TodoTaskStatus
}

function payloadSignature(payload: TaskPositionPayload): string {
  return `${payload.afterId ?? ''}:${payload.beforeId ?? ''}:${payload.status ?? ''}`
}

export function buildTaskPositionFallbacks(
  allTasks: TodoTask[],
  visibleTasks: TodoTask[],
  taskId: string,
  fromStatus: TodoTaskStatus,
  toStatus: TodoTaskStatus,
  toIndex: number,
): TaskPositionPayload[] {
  const primary = buildTaskPositionPayloadFromTasks(
    allTasks,
    visibleTasks,
    taskId,
    fromStatus,
    toStatus,
    toIndex,
  )
  const variants: TaskPositionPayload[] = [primary]
  const status = primary.status
  const columnTasks = columnTasksForStatus(allTasks, toStatus, taskId)
  const insertIndex = resolveServerInsertIndex(
    allTasks,
    visibleTasks,
    taskId,
    fromStatus,
    toStatus,
    toIndex,
  )

  if (insertIndex > 0 && insertIndex < columnTasks.length) {
    variants.push({ afterId: null, beforeId: columnTasks[insertIndex].id, status })
  }

  if (primary.afterId || primary.beforeId) {
    variants.push({ afterId: null, beforeId: null, status })
  }

  const seen = new Set<string>()
  return variants.filter((payload) => {
    const key = payloadSignature(payload)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
