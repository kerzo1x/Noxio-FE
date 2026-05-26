import type { InjectionKey, Ref } from 'vue'

export interface DashboardLayoutMetrics {
  /** Viewport X of the main page column left edge (px). */
  contentAlignLeft: Ref<number>
}

export const dashboardLayoutMetricsKey: InjectionKey<DashboardLayoutMetrics> =
  Symbol('dashboardLayoutMetrics')
