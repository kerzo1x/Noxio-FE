import { defineStore } from 'pinia'
import api from '@/api'
import type { ApiSuccess } from '@/types/api'
import type { EdupageTimetableData, EdupageTimetableLesson } from '@/types/edupage'

export const useTimetableStore = defineStore('timetable', {
  state: () => ({
    lessons: [] as EdupageTimetableLesson[],
    isConnected: false,
    isSyncing: false,
    syncedAt: null as string | null,
    isLoading: false,
    isSyncRequesting: false,
    error: null as string | null,
    loadedWorkspaceId: null as string | null,
  }),

  getters: {
    isNotSynced(state): boolean {
      return (
        state.isConnected &&
        state.syncedAt == null &&
        !state.isSyncing
      )
    },

    hasSyncedTimetable(state): boolean {
      return state.isConnected && state.syncedAt != null
    },
  },

  actions: {
    reset() {
      this.lessons = []
      this.isConnected = false
      this.isSyncing = false
      this.syncedAt = null
      this.error = null
      this.loadedWorkspaceId = null
    },

    applyTimetableData(data: EdupageTimetableData) {
      this.isConnected = data.isConnected
      this.isSyncing = data.isSyncing
      this.syncedAt = data.syncedAt
      this.lessons = data.lessons ?? []
    },

    async fetchTimetable(workspaceId: string, force = false) {
      if (!force && this.loadedWorkspaceId === workspaceId) return

      this.isLoading = true
      this.error = null
      try {
        const response = await api.get<ApiSuccess<EdupageTimetableData>>(
          `/workspaces/${workspaceId}/integrations/edupage/timetable`,
        )
        const payload = response.data
        if (!payload?.success) {
          throw new Error(payload?.message || 'Failed to load timetable')
        }
        this.applyTimetableData(payload.data)
        this.loadedWorkspaceId = workspaceId
      } catch (e) {
        this.lessons = []
        this.error = e instanceof Error ? e.message : 'Failed to load timetable'
      } finally {
        this.isLoading = false
      }
    },

    async syncTimetable(workspaceId: string) {
      this.isSyncRequesting = true
      this.error = null
      try {
        const response = await api.post(
          `/workspaces/${workspaceId}/integrations/edupage/timetable/sync`,
        )
        const payload = response.data
        if (!payload?.success) {
          throw new Error(payload?.message || 'Failed to sync timetable')
        }
        await this.fetchTimetable(workspaceId, true)
      } catch (e) {
        this.error =
          e instanceof Error ? e.message : 'Failed to sync timetable'
        throw e
      } finally {
        this.isSyncRequesting = false
      }
    },
  },
})
