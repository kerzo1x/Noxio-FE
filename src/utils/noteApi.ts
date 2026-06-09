import {
  getNote,
  openNoteRequest,
  patchNoteRequest,
} from '@/api/notes'
import type { ApiSuccess } from '@/types/api'
import { isAxiosLikeError, unwrapCaught } from '@/types/errors'
import type { JsonObject, JsonValue } from '@/types/json'
import { isJsonObject } from '@/types/json'
import type { NoteDetail, NoteListItem, NotePatchBody } from '@/types/notes'
import {
  coerceNoteBlocksFromJson,
  createDefaultNoteContent,
  normalizeBlocksForApi,
} from '@/utils/noteContent'

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

function isNonEmptyId(id: JsonValue | undefined): id is string {
  return typeof id === 'string' && id.length > 0
}

function extractFromApiSuccess(
  envelope: ApiSuccess<Partial<NoteDetail> & { id: string }>,
): NotePayload | null {
  if (!envelope.success || !envelope.data?.id) return null
  return { ...envelope.data, id: envelope.data.id }
}

function notePayloadFromObject(record: JsonObject): NotePayload | null {
  if (!isNonEmptyId(record.id)) return null
  if (typeof record.title !== 'string' && !Array.isArray(record.content)) return null

  const payload: NotePayload = { id: record.id }
  if (typeof record.title === 'string') payload.title = record.title
  if (typeof record.folderId === 'string') payload.folderId = record.folderId
  if (Array.isArray(record.content)) {
    payload.content = coerceNoteBlocksFromJson(record.content)
  }
  if (typeof record.contentVersion === 'number') payload.contentVersion = record.contentVersion
  if (record.coverMediaId === null || typeof record.coverMediaId === 'string') {
    payload.coverMediaId = record.coverMediaId
  }
  return payload
}

/** Deep search for GET /notes/:id payloads when the server returns 400 but embeds the real note under `found` or nested objects. */
function extractNoteFromResponseBodyDeep(
  body: JsonValue | undefined,
  depth = 0,
): NotePayload | null {
  if (depth > 12 || !isJsonObject(body)) return null

  if (body.success === true && isJsonObject(body.data)) {
    const fromData = notePayloadFromObject(body.data)
    if (fromData) return fromData
  }

  const direct = notePayloadFromObject(body)
  if (direct) return direct

  const found = body.found
  if (isJsonObject(found)) {
    const nested = extractNoteFromResponseBodyDeep(found, depth + 1)
    if (nested) return nested
  }

  for (const value of Object.values(body)) {
    if (isJsonObject(value)) {
      const nested = extractNoteFromResponseBodyDeep(value, depth + 1)
      if (nested) return nested
    }
  }

  return null
}

export function extractNoteFromResponseBody(
  body: JsonValue | ApiSuccess<Partial<NoteDetail> & { id: string }> | undefined,
): NotePayload | null {
  if (body && typeof body === 'object' && 'success' in body) {
    const fromEnvelope = extractFromApiSuccess(
      body as ApiSuccess<Partial<NoteDetail> & { id: string }>,
    )
    if (fromEnvelope) return fromEnvelope
  }
  return extractNoteFromResponseBodyDeep(body as JsonValue | undefined, 0)
}

function responseDataFromCaught(caught: object | string | undefined): JsonValue | undefined {
  if (!caught || typeof caught === 'string') return undefined
  if (!isAxiosLikeError(caught)) return undefined
  const data = caught.response?.data
  return typeof data === 'object' && data !== null ? (data as JsonObject) : undefined
}

export async function fetchNoteDetailSafe(
  noteId: string,
  listFallback?: NoteListItem,
): Promise<NoteDetail> {
  try {
    const response = await getNote(noteId)
    const extracted = extractNoteFromResponseBody(response.data as JsonValue)
    if (extracted) {
      return normalizeNoteDetail(extracted, listFallback)
    }
  } catch (caught) {
    const errData = responseDataFromCaught(unwrapCaught(caught))
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

  try {
    const response = await patchNoteRequest(noteId, payload)
    const envelope = response.data
    if (envelope?.success && envelope.data?.id) {
      return normalizeNoteDetail(envelope.data)
    }
    const extracted = extractNoteFromResponseBody(envelope)
    if (extracted) {
      return normalizeNoteDetail(extracted)
    }
    throw new Error(envelope?.message || 'Failed to update note')
  } catch (caught) {
    const errData = responseDataFromCaught(unwrapCaught(caught))
    if (errData) {
      const extracted = extractNoteFromResponseBody(errData)
      if (extracted) {
        return normalizeNoteDetail(extracted)
      }
    }
    const error = unwrapCaught(caught)
    if (error instanceof Error) throw error
    throw new Error('Failed to update note')
  }
}

export async function openNote(noteId: string): Promise<void> {
  await openNoteRequest(noteId)
}
