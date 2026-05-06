import { defineStore } from 'pinia'
import api from '@/api'
import type { ApiSuccess, PaginationMeta } from '@/types/api'

export interface Folder {
  id: string
  name: string
  workspaceId: string
  createdAt: string
  updatedAt: string
  isPinned: boolean
  pinnedAt: string | null
  lastInteractedAt: string | null
  noteCount: number
}

interface FoldersQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filter?: string
}

const defaultQuery: Required<FoldersQuery> = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'asc',
  filter: 'recentlyUpdated'
}

export const useFoldersStore = defineStore('folders', {
  state: () => ({
    folders: [] as Folder[],
    meta: null as PaginationMeta | null,
    isLoading: false,
    error: null as string | null,
    loadedWorkspaceId: null as string | null
  }),

  actions: {
    reset() {
      this.folders = []
      this.meta = null
      this.error = null
      this.isLoading = false
      this.loadedWorkspaceId = null
    },

    async fetchFolders(workspaceId: string, query: FoldersQuery = {}) {
      if (!workspaceId) {
        this.reset()
        return
      }

      const params = { ...defaultQuery, ...query }

      this.isLoading = true
      this.error = null

      try {
        const response = await api.get<ApiSuccess<Folder[]>>(
          `/workspaces/${workspaceId}/folders`,
          { params }
        )
        const payload = response.data

        if (!payload?.success) {
          throw new Error(payload?.message || 'Failed to fetch folders')
        }

        this.folders = payload.data
        this.meta = payload.meta ?? null
        this.loadedWorkspaceId = workspaceId
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : 'Failed to fetch folders'
        this.folders = []
        this.meta = null
        this.loadedWorkspaceId = null
      } finally {
        this.isLoading = false
      }
    }
  }
})
