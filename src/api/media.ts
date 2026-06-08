import api from '@/api'
import type { ApiSuccess } from '@/types/api'

export type MediaType = 'USER_AVATAR' | 'WORKSPACE_AVATAR' | 'NOTE_ATTACHMENT'

export interface UploadedMedia {
  id: string
  type: MediaType
  fileUrl: string
  filename: string
  fileType: string
  size: number
  workspaceId: string | null
  createdAt: string
}

export function uploadMedia(
  file: File,
  opts: { type: MediaType; workspaceId?: string },
) {
  const form = new FormData()
  form.append('file', file)
  form.append('type', opts.type)
  if (opts.workspaceId) {
    form.append('workspaceId', opts.workspaceId)
  }
  return api.post<ApiSuccess<UploadedMedia>>('/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function listWorkspaceMedia(workspaceId: string) {
  return api.get<ApiSuccess<UploadedMedia[]>>(
    `/workspaces/${workspaceId}/media`,
  )
}
