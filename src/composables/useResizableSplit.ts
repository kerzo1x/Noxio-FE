import { computed, onUnmounted, ref, watch } from 'vue'

const STORAGE_KEY = 'notes-split-list-ratio'

const DEFAULT_RATIO = 0.32
const MIN_RATIO = 0.22
const MAX_RATIO = 0.5
const COLLAPSE_THRESHOLD = 0.05

function readStoredRatio(): number {
  if (typeof window === 'undefined') return DEFAULT_RATIO
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return DEFAULT_RATIO
  const parsed = Number.parseFloat(raw)
  if (Number.isNaN(parsed)) return DEFAULT_RATIO
  return Math.min(MAX_RATIO, Math.max(0, parsed))
}

export function useResizableSplit(containerRef: { value: HTMLElement | null }) {
  const listRatio = ref(readStoredRatio())
  const lastExpandedRatio = ref(
    listRatio.value > COLLAPSE_THRESHOLD ? listRatio.value : DEFAULT_RATIO,
  )
  const isDragging = ref(false)
  const isListCollapsed = computed(() => listRatio.value <= COLLAPSE_THRESHOLD)

  const listFlexStyle = computed(() => {
    if (isListCollapsed.value) {
      return { flex: '0 0 0', width: '0', minWidth: '0', overflow: 'hidden' }
    }
    const percent = listRatio.value * 100
    return { flex: `0 0 ${percent}%`, minWidth: '0' }
  })

  watch(listRatio, (value) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, String(value))
    if (value > COLLAPSE_THRESHOLD) {
      lastExpandedRatio.value = value
    }
  })

  function setRatioFromPointer(clientX: number) {
    const container = containerRef.value
    if (!container) return

    const rect = container.getBoundingClientRect()
    if (rect.width <= 0) return

    const rawRatio = (clientX - rect.left) / rect.width
    if (rawRatio < COLLAPSE_THRESHOLD) {
      listRatio.value = 0
      return
    }

    listRatio.value = Math.min(MAX_RATIO, Math.max(MIN_RATIO, rawRatio))
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

  function startDragging(event: PointerEvent) {
    if (isListCollapsed.value) {
      listRatio.value = lastExpandedRatio.value || DEFAULT_RATIO
    }
    isDragging.value = true
    setRatioFromPointer(event.clientX)
    if (typeof window === 'undefined') return
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)
  }

  function expandList() {
    listRatio.value = lastExpandedRatio.value || DEFAULT_RATIO
  }

  onUnmounted(stopDragging)

  return {
    listRatio,
    isListCollapsed,
    isDragging,
    listFlexStyle,
    startDragging,
    expandList,
  }
}
