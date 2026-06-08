import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getNotesListMinWidthPx } from '@/constants/notesLayout'

const STORAGE_KEY = 'notes-split-list-ratio'

const DEFAULT_RATIO = 0.32
const MAX_RATIO = 0.5
const COLLAPSE_THRESHOLD = 0.2

function readStoredRatio(): number {
  if (typeof window === 'undefined') return DEFAULT_RATIO
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return DEFAULT_RATIO
  const parsed = Number.parseFloat(raw)
  if (Number.isNaN(parsed)) return DEFAULT_RATIO
  return Math.min(MAX_RATIO, Math.max(0, parsed))
}

function getMinRatio(width: number): number {
  if (width <= 0) return 1
  const minWidthPx = getNotesListMinWidthPx()
  return Math.min(1, minWidthPx / width)
}

function clampExpandedRatio(ratio: number, width: number): number {
  if (ratio <= COLLAPSE_THRESHOLD) return 0
  const minRatio = getMinRatio(width)
  return Math.min(MAX_RATIO, Math.max(minRatio, ratio))
}

export function useResizableSplit(containerRef: { value: HTMLElement | null }) {
  const listRatio = ref(readStoredRatio())
  const isDragging = ref(false)
  const isListCollapsed = computed(() => listRatio.value <= COLLAPSE_THRESHOLD)

  let resizeObserver: ResizeObserver | null = null

  function normalizeRatioForContainer(width: number) {
    if (width <= 0) return
    listRatio.value = clampExpandedRatio(listRatio.value, width)
  }

  const listFlexStyle = computed(() => {
    if (isListCollapsed.value) {
      return { flex: '0 0 0', width: '0', minWidth: '0', overflow: 'hidden' }
    }
    const percent = listRatio.value * 100
    return { flex: `0 0 ${percent}%`, minWidth: '0' }
  })

  // TODO: tu chyba debounce, lebo teraz ti to pri 60 fps da 60 callov localStorage a daj tam nejaky debounce, aby to nesekalo
  watch(listRatio, (value) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, String(value))
  })

  function setRatioFromPointer(clientX: number) {
    const container = containerRef.value
    if (!container) return

    const rect = container.getBoundingClientRect()
    if (rect.width <= 0) return

    const rawRatio = (clientX - rect.left) / rect.width

    if (rawRatio <= COLLAPSE_THRESHOLD) {
      listRatio.value = 0
      return
    }

    const minRatio = getMinRatio(rect.width)
    if (rawRatio < minRatio) {
      listRatio.value = 0
      return
    }

    listRatio.value = Math.min(MAX_RATIO, rawRatio)
  }

  function onPointerMove(event: PointerEvent) {
    if (!isDragging.value) return
    setRatioFromPointer(event.clientX)
  }

  function stopDragging() {
    isDragging.value = false
    if (typeof window === 'undefined') return
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', stopDragging)
    window.removeEventListener('pointercancel', stopDragging)
  }

  function expandToMinWidth() {
    const container = containerRef.value
    if (!container) {
      listRatio.value = DEFAULT_RATIO
      return
    }
    const rect = container.getBoundingClientRect()
    if (rect.width <= 0) {
      listRatio.value = DEFAULT_RATIO
      return
    }
    listRatio.value = getMinRatio(rect.width)
  }

  function startDragging(event: PointerEvent) {
    if (isListCollapsed.value) {
      expandToMinWidth()
    }
    isDragging.value = true
    setRatioFromPointer(event.clientX)
    if (typeof window === 'undefined') return
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)
  }

  function expandList() {
    expandToMinWidth()
  }

  onMounted(() => {
    const container = containerRef.value
    if (!container || typeof ResizeObserver === 'undefined') return

    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      normalizeRatioForContainer(entry.contentRect.width)
    })
    resizeObserver.observe(container)
    normalizeRatioForContainer(container.getBoundingClientRect().width)
  })

  onUnmounted(() => {
    stopDragging()
    resizeObserver?.disconnect()
    resizeObserver = null
  })

  return {
    listRatio,
    isListCollapsed,
    isDragging,
    listFlexStyle,
    startDragging,
    expandList,
  }
}
