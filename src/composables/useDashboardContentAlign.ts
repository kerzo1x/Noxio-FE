import {
  ref,
  onMounted,
  onUnmounted,
  nextTick,
  watch,
  type Ref,
} from 'vue'
import { useRoute } from 'vue-router'

const PAGE_COLUMN_SELECTOR = '.dashboard-page-column'

export function useDashboardContentAlign(railRef: Ref<HTMLElement | null>) {
  const contentAlignLeft = ref(0)

  let resizeObserver: ResizeObserver | null = null
  let rafId = 0

  function measure() {
    cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      const rail = railRef.value
      if (!rail) {
        contentAlignLeft.value = 0
        return
      }

      const column = rail.querySelector(
        PAGE_COLUMN_SELECTOR,
      ) as HTMLElement | null
      const target =
        column ?? (rail.firstElementChild as HTMLElement | null)
      if (!target) {
        contentAlignLeft.value = 0
        return
      }

      contentAlignLeft.value = target.getBoundingClientRect().left
    })
  }

  function observeTargets() {
    resizeObserver?.disconnect()
    resizeObserver = new ResizeObserver(measure)

    const rail = railRef.value
    if (!rail) return

    resizeObserver.observe(rail)
    for (const child of rail.children) {
      if (child instanceof HTMLElement) {
        resizeObserver.observe(child)
      }
    }
  }

  const route = useRoute()

  watch(
    () => route.fullPath,
    () => {
      nextTick(() => {
        measure()
        observeTargets()
      })
    },
  )

  watch(railRef, (rail) => {
    if (!rail) return
    nextTick(() => {
      measure()
      observeTargets()
    })
  })

  onMounted(() => {
    measure()
    observeTargets()
    window.addEventListener('resize', measure, { passive: true })
    void document.fonts?.ready?.then(measure)
  })

  onUnmounted(() => {
    cancelAnimationFrame(rafId)
    resizeObserver?.disconnect()
    window.removeEventListener('resize', measure)
  })

  return { contentAlignLeft, remeasure: measure }
}
