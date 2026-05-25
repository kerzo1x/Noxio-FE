import { defineStore } from 'pinia'
import { listNotifications, type NotificationItem } from '@/api/notifications'

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    items: [] as NotificationItem[],
    isLoading: false,
    error: null as string | null,
    loadedWorkspaceId: null as string | null,
  }),

  getters: {
    hasNotifications(state): boolean {
      return state.items.length > 0
    },
  },

  actions: {
    reset() {
      this.items = []
      this.isLoading = false
      this.error = null
      this.loadedWorkspaceId = null
    },

    async fetchNotifications(
      workspaceId: string | null,
      opts?: { force?: boolean },
    ) {
      if (!workspaceId) {
        this.reset()
        return
      }

      if (
        !opts?.force &&
        this.loadedWorkspaceId === workspaceId &&
        !this.error
      ) {
        return
      }

      this.isLoading = true
      this.error = null

      try {
        const response = await listNotifications(workspaceId)
        const payload = response.data

        if (!payload?.success) {
          throw new Error('Failed to fetch notifications')
        }

        this.items = payload.data?.items ?? []
        this.loadedWorkspaceId = workspaceId
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
        this.items = []
        this.error =
          error instanceof Error ? error.message : 'Failed to fetch notifications'
        this.loadedWorkspaceId = null
      } finally {
        this.isLoading = false
      }
    },
  },
})
