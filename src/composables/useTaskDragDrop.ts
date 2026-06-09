import { nextTick, ref } from 'vue'
import type { TodoTask, TodoTaskStatus } from '@/stores/todoLists'

export function useTaskDragDrop(
  getTasksForColumn: (status: TodoTaskStatus) => TodoTask[],
  onMoveTask: (taskId: string, status: TodoTaskStatus, index: number) => void,
) {
  const draggedTaskId = ref<string | null>(null)
  const hideDragSource = ref(false)
  const dropTarget = ref<{ status: TodoTaskStatus; index: number } | null>(null)
  let dragPreviewEl: HTMLElement | null = null

  const dropLineBase =
    'w-full rounded-full transition-[height,background-color,box-shadow,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
  const dropLineActive = 'h-px bg-white/70 shadow-[0_0_4px_rgba(255,255,255,0.2)]'
  const dropLineHint = 'h-px bg-white/[0.07]'
  const dropLineHidden = 'h-px bg-transparent opacity-0'

  function onDragStart(event: DragEvent, task: TodoTask) {
    draggedTaskId.value = task.id
    dropTarget.value = null
    if (!event.dataTransfer) return
    event.dataTransfer.setData('text/plain', task.id)
    event.dataTransfer.effectAllowed = 'move'

    const source = event.currentTarget as HTMLElement | null
    if (!source) return

    const rect = source.getBoundingClientRect()
    dragPreviewEl = source.cloneNode(true) as HTMLElement
    dragPreviewEl.style.position = 'fixed'
    dragPreviewEl.style.top = '-9999px'
    dragPreviewEl.style.left = '0'
    dragPreviewEl.style.width = `${rect.width}px`
    dragPreviewEl.style.height = `${rect.height}px`
    dragPreviewEl.style.opacity = '1'
    dragPreviewEl.style.pointerEvents = 'none'
    dragPreviewEl.style.boxShadow = '0 14px 36px rgba(0,0,0,0.5)'
    document.body.appendChild(dragPreviewEl)
    event.dataTransfer.setDragImage(dragPreviewEl, rect.width / 2, rect.height / 2)

    void nextTick(() => {
      hideDragSource.value = true
    })
  }

  function onDragEnd() {
    dragPreviewEl?.remove()
    dragPreviewEl = null
    hideDragSource.value = false
    draggedTaskId.value = null
    dropTarget.value = null
  }

  function getColumnEl(event: DragEvent): HTMLElement | null {
    return (event.currentTarget as HTMLElement).closest('.column-drop-zone')
  }

  function resolveDropIndex(event: DragEvent, status: TodoTaskStatus): number {
    const columnEl = getColumnEl(event)
    if (!columnEl) return 0

    const tasks = getTasksForColumn(status)
    if (tasks.length === 0) return 0

    const cards = Array.from(
      columnEl.querySelectorAll<HTMLElement>('[data-task-card]'),
    ).filter((card) => card.dataset.taskId !== draggedTaskId.value)

    if (cards.length === 0) return 0

    const y = event.clientY

    for (const card of cards) {
      const rect = card.getBoundingClientRect()
      if (y < rect.top + rect.height / 2) {
        const taskId = card.dataset.taskId
        const index = tasks.findIndex((task) => task.id === taskId)
        return index === -1 ? 0 : index
      }
    }

    const lastCard = cards[cards.length - 1]
    if (lastCard && y >= lastCard.getBoundingClientRect().bottom - 12) {
      return tasks.length
    }

    return tasks.length
  }

  function onColumnDragEnter(event: DragEvent) {
    if (!draggedTaskId.value) return
    event.preventDefault()
  }

  function onColumnDragOver(event: DragEvent, status: TodoTaskStatus) {
    event.preventDefault()
    if (!draggedTaskId.value) return
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
    dropTarget.value = { status, index: resolveDropIndex(event, status) }
  }

  function onColumnDrop(event: DragEvent, status: TodoTaskStatus) {
    event.preventDefault()
    onDrop(status, resolveDropIndex(event, status))
  }

  function onDrop(status: TodoTaskStatus, index: number) {
    const taskId = draggedTaskId.value
    if (!taskId) return
    draggedTaskId.value = null
    dropTarget.value = null
    onMoveTask(taskId, status, index)
  }

  function isDropIndicatorVisible(status: TodoTaskStatus, index: number) {
    return dropTarget.value?.status === status && dropTarget.value.index === index
  }

  function isDropSlotActive(status: TodoTaskStatus, index: number) {
    return isDropIndicatorVisible(status, index)
  }

  function isDropSlotHintVisible(status: TodoTaskStatus, index: number) {
    return Boolean(draggedTaskId.value) && !isDropSlotActive(status, index)
  }

  function isDraggingTask(taskId: string) {
    return draggedTaskId.value === taskId
  }

  return {
    draggedTaskId,
    hideDragSource,
    dropLineBase,
    dropLineActive,
    dropLineHint,
    dropLineHidden,
    onDragStart,
    onDragEnd,
    onColumnDragEnter,
    onColumnDragOver,
    onColumnDrop,
    isDropSlotActive,
    isDropSlotHintVisible,
    isDraggingTask,
  }
}
