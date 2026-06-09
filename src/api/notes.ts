import api from '@/api'
import type { ApiSuccess } from '@/types/api'
import type { NoteBlock, NoteDetail, NoteListItem, NotePatchBody } from '@/types/notes'
import { normalizeBlocksForApi } from '@/utils/noteContent'

export interface NotesQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filter?: string
}

export function listFolderNotes(folderId: string, params: NotesQuery) {
  return api.get<ApiSuccess<NoteListItem[]>>(`/folders/${folderId}/notes`, { params })
}

export function createNoteInFolder(
  folderId: string,
  body: { title: string; content: NoteBlock[] },
) {
  return api.post<ApiSuccess<Partial<NoteDetail> & { id: string }>>(
    `/folders/${folderId}/notes`,
    body,
    {
      validateStatus: (status) => status === 201 || status === 200 || status === 400,
    },
  )
}

export function getNote(noteId: string) {
  return api.get(`/notes/${noteId}`, {
    validateStatus: (status) =>
      status === 200 || status === 400 || status === 404 || status === 422,
  })
}

export function patchNoteRequest(noteId: string, body: NotePatchBody) {
  const payload: NotePatchBody = { ...body }
  if (payload.content) {
    payload.content = normalizeBlocksForApi(payload.content)
  }
  return api.patch<ApiSuccess<NoteDetail>>(`/notes/${noteId}`, payload, {
    validateStatus: (status) => status === 200 || status === 400,
  })
}

export function openNoteRequest(noteId: string) {
  return api.post(`/notes/${noteId}/open`)
}
