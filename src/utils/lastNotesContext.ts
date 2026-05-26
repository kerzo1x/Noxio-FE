export interface LastNotesContext {
  folderId: string
  noteId: string | null
}

const STORAGE_KEY = 'notion_fe_last_notes_context'

type StoredByWorkspace = Record<string, LastNotesContext>

function readAll(): StoredByWorkspace {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as StoredByWorkspace
    if (!parsed || typeof parsed !== 'object') return {}

    return parsed
  } catch {
    return {}
  }
}

function writeAll(data: StoredByWorkspace) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* ignore quota / private mode */
  }
}

export function getLastNotesContext(
  workspaceId: string,
): LastNotesContext | null {
  const entry = readAll()[workspaceId]
  if (!entry || typeof entry.folderId !== 'string' || !entry.folderId) {
    return null
  }

  return {
    folderId: entry.folderId,
    noteId: typeof entry.noteId === 'string' ? entry.noteId : null,
  }
}

export function setLastNotesContext(
  workspaceId: string,
  patch: { folderId: string; noteId?: string | null },
) {
  const all = readAll()
  const previous = all[workspaceId]

  all[workspaceId] = {
    folderId: patch.folderId,
    noteId:
      patch.noteId !== undefined
        ? patch.noteId
        : patch.folderId === previous?.folderId
          ? (previous.noteId ?? null)
          : null,
  }

  writeAll(all)
}

export function rememberFolder(workspaceId: string, folderId: string) {
  // When entering the notes view without a selected note, we still want to
  // restore the last edited note for the same folder.
  // So we don't force-override noteId to null here.
  setLastNotesContext(workspaceId, { folderId })
}

export function rememberNote(
  workspaceId: string,
  folderId: string,
  noteId: string,
) {
  setLastNotesContext(workspaceId, { folderId, noteId })
}
