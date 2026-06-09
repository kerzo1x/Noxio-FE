import { ref, computed, watch, onMounted, onUnmounted, inject, type Ref } from 'vue'
import { dashboardLayoutMetricsKey } from '@/composables/useDashboardContentAlign'

export function useHeaderSidebarAlign(sidebarRef: Ref<HTMLElement | null>) {
  const sidebarRight = ref(0)
  const layoutMetrics = inject(dashboardLayoutMetricsKey, null)

  let observer: ResizeObserver | null = null

  function measure() {
    sidebarRight.value = sidebarRef.value?.getBoundingClientRect().right ?? 0
  }

  const searchAreaStyle = computed(() => {
    const contentLeft = layoutMetrics?.contentAlignLeft.value ?? 0
    if (!contentLeft) return undefined
    const inset = Math.max(0, Math.round(contentLeft - sidebarRight.value))
    return { paddingLeft: `${inset}px` }
  })

  onMounted(() => {
    measure()
    if (!sidebarRef.value) return
    observer = new ResizeObserver(measure)
    observer.observe(sidebarRef.value)
    window.addEventListener('resize', measure, { passive: true })
  })

  watch(() => layoutMetrics?.contentAlignLeft.value, measure)

  onUnmounted(() => {
    observer?.disconnect()
    window.removeEventListener('resize', measure)
  })

  return { searchAreaStyle }
}
