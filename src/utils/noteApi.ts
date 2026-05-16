import api from '@/api'
import type { ApiSuccess } from '@/types/api'
import type { NoteDetail, NoteListItem, NotePatchBody } from '@/types/notes'
import { createDefaultNoteContent, normalizeBlocksForApi } from '@/utils/noteContent'

type NotePayload = Partial<NoteDetail> & { id: string }

function listItemToDetail(listItem: NoteListItem): NoteDetail {
  return {
    ...listItem,
    content: [],
    contentVersion: 0,
    coverMediaId: null,
  }
}

export function normalizeNoteDetail(
  raw: NotePayload,
  listFallback?: NoteListItem,
): NoteDetail {
  const base = listFallback ? listItemToDetail(listFallback) : null

  return {
    id: raw.id,
    folderId: raw.folderId ?? base?.folderId ?? '',
    title: raw.title ?? base?.title ?? 'Untitled',
    content: Array.isArray(raw.content)
      ? normalizeBlocksForApi(raw.content)
      : (base?.content ?? createDefaultNoteContent()),
    contentVersion: raw.contentVersion ?? base?.contentVersion ?? 0,
    coverMediaId: raw.coverMediaId ?? base?.coverMediaId ?? null,
    lastEditedById: raw.lastEditedById ?? base?.lastEditedById ?? '',
    createdAt: String(raw.createdAt ?? base?.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? base?.updatedAt ?? ''),
    isPinned: raw.isPinned ?? base?.isPinned ?? false,
    pinnedAt: raw.pinnedAt ?? base?.pinnedAt ?? null,
    lastInteractedAt: raw.lastInteractedAt ?? base?.lastInteractedAt ?? null,
    recentEditors: raw.recentEditors ?? base?.recentEditors ?? [],
    totalEditorCount: raw.totalEditorCount ?? base?.totalEditorCount ?? 0,
  }
}

function isNonEmptyId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0
}

/** Deep search for GET /notes/:id payloads when the server returns 400 (response schema drift, e.g. missing coverMediaId) but embeds the real note under `found` or nested objects. */
function extractNoteFromResponseBodyDeep(
  body: unknown,
  depth = 0,
): NotePayload | null {
  if (depth > 12 || body == null || typeof body !== 'object') return null

  const record = body as Record<string, unknown>

  if (record.success === true && record.data && typeof record.data === 'object') {
    const data = record.data as Record<string, unknown>
    if (isNonEmptyId(data.id)) {
      return record.data as NotePayload
    }
  }

  if (
    isNonEmptyId(record.id) &&
    (typeof record.title === 'string' ||
      Array.isArray(record.content))
  ) {
    return record as NotePayload
  }

  const found = record.found
  if (found && typeof found === 'object') {
    const nested = extractNoteFromResponseBodyDeep(found, depth + 1)
    if (nested) return nested
  }

  for (const value of Object.values(record)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = extractNoteFromResponseBodyDeep(value, depth + 1)
      if (nested) return nested
    }
  }

  return null
}

export function extractNoteFromResponseBody(body: unknown): NotePayload | null {
  return extractNoteFromResponseBodyDeep(body, 0)
}

export async function fetchNoteDetailSafe(
  noteId: string,
  listFallback?: NoteListItem,
): Promise<NoteDetail> {
  try {
    const response = await api.get(`/notes/${noteId}`, {
      validateStatus: (status) =>
        status === 200 || status === 400 || status === 404 || status === 422,
    })

    const extracted = extractNoteFromResponseBody(response.data)
    if (extracted) {
      return normalizeNoteDetail(extracted, listFallback)
    }
  } catch (error) {
    const errData = (error as { response?: { data?: unknown } })?.response?.data
    if (errData) {
      const extracted = extractNoteFromResponseBody(errData)
      if (extracted) {
        return normalizeNoteDetail(extracted, listFallback)
      }
    }
  }

  if (listFallback) {
    return listItemToDetail(listFallback)
  }

  throw new Error('Failed to fetch note')
}

export function noteDetailFromCreateResponse(
  raw: Partial<NoteDetail> & { id: string },
  folderId: string,
): NoteDetail {
  return normalizeNoteDetail(
    {
      ...raw,
      folderId: raw.folderId ?? folderId,
      content: raw.content ?? createDefaultNoteContent(),
    },
    undefined,
  )
}

export async function patchNote(
  noteId: string,
  body: NotePatchBody,
): Promise<NoteDetail> {
  const payload: NotePatchBody = { ...body }
  if (payload.content) {
    payload.content = normalizeBlocksForApi(payload.content)
  }

  const response = await api.patch<ApiSuccess<NoteDetail>>(`/notes/${noteId}`, payload)
  const extracted = extractNoteFromResponseBody(response.data)

  if (extracted) {
    return normalizeNoteDetail(extracted)
  }

  throw new Error(
    (response.data as { message?: string })?.message || 'Failed to update note',
  )
}

export async function openNote(noteId: string): Promise<void> {
  await api.post(`/notes/${noteId}/open`)
}
