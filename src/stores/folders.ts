import { defineStore } from 'pinia'
import {
  createFolder as createFolderApi,
  deleteFolder as deleteFolderApi,
  listFolders,
  updateFolder as updateFolderApi,
  type FoldersQuery,
} from '@/api/folders'
import type { PaginationMeta } from '@/types/api'
import { unwrapCaught } from '@/types/errors'
import { getApiErrorMessage, resolveWorkspaceId } from '@/utils/storeHelpers'

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

const defaultQuery: Required<FoldersQuery> = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'asc',
  filter: 'recentlyUpdated',
}

const folderNotFoundMessage = 'Folder not found. It may have been deleted already.'

export const useFoldersStore = defineStore('folders', {
  state: () => ({
    folders: [] as Folder[],
    meta: null as PaginationMeta | null,
    isLoading: false,
    error: null as string | null,
    loadedWorkspaceId: null as string | null,
  }),

  actions: {
    reset() {
      this.folders = []
      this.meta = null
      this.error = null
      this.isLoading = false
      this.loadedWorkspaceId = null
    },

    async fetchFolders(
      workspaceId: string,
      query: FoldersQuery = {},
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

      const params = { ...defaultQuery, ...query }

      this.isLoading = true
      this.error = null

      try {
        const response = await listFolders(workspaceId, params)
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
        const response = await createFolderApi(workspaceId, trimmed)
        const payload = response.data
        if (!payload?.success) {
          throw new Error(payload?.message || 'Failed to create folder')
        }
        const created = payload.data
        if (this.loadedWorkspaceId === workspaceId) {
          this.folders = [...this.folders, created]
        }
        return created
      } catch (caught) {
        throw new Error(
          getApiErrorMessage(unwrapCaught(caught), 'Failed to create folder', folderNotFoundMessage),
        )
      }
    },

    async updateFolder(
      folderId: string,
      payload: {
        name: string
        description: string
        originalDescription: string | null
      },
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
        const response = await updateFolderApi(folderId, body)
        const result = response.data
        if (!result?.success) {
          throw new Error(result?.message || 'Failed to update folder')
        }
        const updated = result.data
        const index = this.folders.findIndex((f) => f.id === folderId)
        if (index !== -1) {
          this.folders = [
            ...this.folders.slice(0, index),
            updated,
            ...this.folders.slice(index + 1),
          ]
        }
        return updated
      } catch (caught) {
        throw new Error(
          getApiErrorMessage(unwrapCaught(caught), 'Failed to update folder', folderNotFoundMessage),
        )
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
        await this.fetchFolders(workspaceId, {}, { force: true })
        throw new Error('This folder is not in the current workspace.')
      }

      try {
        const response = await deleteFolderApi(folderId)
        const { status, data } = response
        const payload = data as { success?: boolean; message?: string } | undefined

        const isHttpSuccess = status >= 200 && status < 300
        const isJsonFailure =
          payload &&
          typeof payload === 'object' &&
          'success' in payload &&
          payload.success === false

        if (!isHttpSuccess || isJsonFailure) {
          throw new Error(
            (payload && typeof payload === 'object' && payload.message) ||
            'Failed to delete folder',
          )
        }

        this.folders = this.folders.filter((f) => f.id !== folderId)
      } catch (caught) {
        const error = unwrapCaught(caught)
        const status =
          error &&
          typeof error === 'object' &&
          'response' in error &&
          (error as { response?: { status?: number } }).response?.status

        if (status === 404) {
          this.folders = this.folders.filter((f) => f.id !== folderId)
        }

        throw new Error(
          getApiErrorMessage(error, 'Failed to delete folder', folderNotFoundMessage),
        )
      }
    },
  },
})
