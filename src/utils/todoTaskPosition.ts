import type { TodoTask, TodoTaskStatus } from '@/stores/todoLists'

function sortTasksByPosition(tasks: TodoTask[]): TodoTask[] {
  const sorted: TodoTask[] = []
  for (let i = 0; i < tasks.length; i++) {
    sorted.push(tasks[i]) // TODO: toto je manualna kopia a vies to cele fixnut funkciou pod tym
  }
  sorted.sort((a, b) => a.position - b.position)
  return sorted
}
/**
 * function sortTasksByPosition(tasks: TodoTask[]): TodoTask[] {
 *   return [...tasks].sort((a, b) => a.position - b.position)
 * }
 */

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

  for (let i = 0; i < allTasks.length; i++) {
    const item = allTasks[i]
    if (item.id === afterId || item.id === beforeId) continue
    if (item.position > minPos && item.position < maxPos) return false
  }
  return true
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
    if (toStatus !== fromStatus) {
      return { ...payload, status: toStatus }
    }
    return payload
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
