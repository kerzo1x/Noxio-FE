export type TodoTasksPeriodFilter = 'today' | 'week' | 'month' | 'all'

export const DEFAULT_TODO_TASKS_PERIOD: TodoTasksPeriodFilter = 'week'

const STORAGE_KEY = 'notion_fe_todo_tasks_period_filter'

const VALID_PERIODS = new Set<TodoTasksPeriodFilter>([
  'today',
  'week',
  'month',
  'all',
])

export function getTodoTasksPeriodFilter(): TodoTasksPeriodFilter {
  if (typeof window === 'undefined') return DEFAULT_TODO_TASKS_PERIOD

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_TODO_TASKS_PERIOD
    if (VALID_PERIODS.has(raw as TodoTasksPeriodFilter)) {
      return raw as TodoTasksPeriodFilter
    }
    return DEFAULT_TODO_TASKS_PERIOD
  } catch {
    return DEFAULT_TODO_TASKS_PERIOD
  }
}

export function setTodoTasksPeriodFilter(period: TodoTasksPeriodFilter) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, period)
  } catch {
    /* ignore quota / private mode */
  }
}
