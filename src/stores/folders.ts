import { defineStore } from 'pinia'
import api from '@/api'
import { useWorkspaceStore } from '@/stores/workspace'
import type { ApiSuccess, PaginationMeta } from '@/types/api'

export interface Folder {
  id: string
  name: string
  description: string | null
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

function resolveWorkspaceId(storeLoadedId: string | null): string | null {
  const activeId = useWorkspaceStore().activeWorkspace?.id ?? null
  return activeId ?? storeLoadedId
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const res = (error as { response?: { status?: number; data?: { message?: string } } })
      .response
    if (res?.data?.message) return res.data.message
    if (res?.status === 404) return 'Folder not found. It may have been deleted already.'
  }
  if (error instanceof Error) return error.message
  return fallback
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
    },

    async createFolder(workspaceId: string, name: string) {
      const trimmed = name.trim()
      if (!workspaceId) {
        throw new Error('No workspace selected')
      }
      if (!trimmed) {
        throw new Error('Enter a folder name')
      }

      try {
        const response = await api.post<ApiSuccess<Folder>>(
          `/workspaces/${workspaceId}/folders`,
          { name: trimmed }
        )
        const payload = response.data
        if (!payload?.success) {
          throw new Error(payload?.message || 'Failed to create folder')
        }
        await this.fetchFolders(workspaceId)
        return payload.data
      } catch (error: unknown) {
        throw new Error(getApiErrorMessage(error, 'Failed to create folder'))
      }
    },

    async updateFolder(
      folderId: string,
      payload: {
        name: string
        description: string
        originalDescription: string | null
      }
    ) {
      const trimmedName = payload.name.trim()
      if (!folderId) {
        throw new Error('Folder not found')
      }
      if (!trimmedName) {
        throw new Error('Enter a folder name')
      }

      const workspaceId = resolveWorkspaceId(this.loadedWorkspaceId)
      if (!workspaceId) {
        throw new Error('No workspace selected')
      }

      const trimmedDescription = payload.description.trim()
      const normalizedOriginal = (payload.originalDescription ?? '').trim()

      const body: { name: string; description?: string } = {
        name: trimmedName,
      }

      if (trimmedDescription !== normalizedOriginal) {
        body.description = trimmedDescription
      }

      try {
        const response = await api.patch<ApiSuccess<Folder>>(
          `/folders/${folderId}`,
          body
        )
        const result = response.data
        if (!result?.success) {
          throw new Error(result?.message || 'Failed to update folder')
        }
        await this.fetchFolders(workspaceId)
        return result.data
      } catch (error: unknown) {
        throw new Error(getApiErrorMessage(error, 'Failed to update folder'))
      }
    },

    async deleteFolder(folderId: string) {
      if (!folderId) {
        throw new Error('Folder not found')
      }

      const workspaceId = resolveWorkspaceId(this.loadedWorkspaceId)
      if (!workspaceId) {
        throw new Error('No workspace selected')
      }

      const folder = this.folders.find((f) => f.id === folderId)
      if (folder && folder.workspaceId !== workspaceId) {
        await this.fetchFolders(workspaceId)
        throw new Error('This folder is not in the current workspace.')
      }

      try {
        const response = await api.delete(`/folders/${folderId}`)
        const { status, data } = response
        const payload = data as ApiSuccess<null> | undefined

        const isHttpSuccess = status >= 200 && status < 300
        const isJsonFailure =
          payload &&
          typeof payload === 'object' &&
          'success' in payload &&
          payload.success === false

        if (!isHttpSuccess || isJsonFailure) {
          throw new Error(
            (payload && typeof payload === 'object' && payload.message) ||
              'Failed to delete folder'
          )
        }

        await this.fetchFolders(workspaceId)
      } catch (error: unknown) {
        const status =
          error &&
          typeof error === 'object' &&
          'response' in error &&
          (error as { response?: { status?: number } }).response?.status

        if (status === 404) {
          await this.fetchFolders(workspaceId)
        }

        throw new Error(getApiErrorMessage(error, 'Failed to delete folder'))
      }
    },
  },
})
