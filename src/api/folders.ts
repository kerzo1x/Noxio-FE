import api from '@/api'
import type { ApiSuccess } from '@/types/api'
import type { Folder } from '@/stores/folders'

export interface FoldersQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filter?: string
}

export function listFolders(workspaceId: string, params: FoldersQuery) {
  return api.get<ApiSuccess<Folder[]>>(`/workspaces/${workspaceId}/folders`, { params })
}

export function createFolder(workspaceId: string, name: string) {
  return api.post<ApiSuccess<Folder>>(`/workspaces/${workspaceId}/folders`, { name })
}

export function updateFolder(
  folderId: string,
  body: { name: string; description?: string },
) {
  return api.patch<ApiSuccess<Folder>>(`/folders/${folderId}`, body)
}

export function deleteFolder(folderId: string) {
  return api.delete(`/folders/${folderId}`)
}
