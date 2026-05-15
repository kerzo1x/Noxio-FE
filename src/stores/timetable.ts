import { defineStore } from 'pinia'
import api from '@/api'
import type { ApiSuccess } from '@/types/api'
import type { EdupageTimetableData, EdupageTimetableLesson } from '@/types/edupage'

export const useTimetableStore = defineStore('timetable', {
  state: () => ({
    lessons: [] as EdupageTimetableLesson[],
    isConnected: true,
    isSyncing: false,
    isLoading: false,
    error: null as string | null,
    loadedWorkspaceId: null as string | null,
  }),

  actions: {
    reset() {
      this.lessons = []
      this.isConnected = true
      this.isSyncing = false
      this.error = null
      this.loadedWorkspaceId = null
    },

    async fetchTimetable(workspaceId: string) {
      if (this.loadedWorkspaceId === workspaceId) return
      this.isLoading = true
      this.error = null
      try {
        const response = await api.get<ApiSuccess<EdupageTimetableData>>(
          `/workspaces/${workspaceId}/integrations/edupage/timetable`
        )
        const payload = response.data
        if (!payload?.success) {
          throw new Error(payload?.message || 'Failed to load timetable')
        }
        const data = payload.data
        this.isConnected = data.isConnected
        this.isSyncing = data.isSyncing
        this.lessons = data.lessons ?? []
        this.loadedWorkspaceId = workspaceId
      } catch (e) {
        this.lessons = []
        this.error = e instanceof Error ? e.message : 'Failed to load timetable'
      } finally {
        this.isLoading = false
      }
    },
  },
})
