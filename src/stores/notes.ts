import { defineStore } from 'pinia'
import { unwrapCaught } from '@/types/errors'
import { createNoteInFolder, listFolderNotes, type NotesQuery } from '@/api/notes'
import type { PaginationMeta } from '@/types/api'
import { createDefaultNoteContent } from '@/utils/noteContent'
import {
  extractNoteFromResponseBody,
  fetchNoteDetailSafe,
  noteDetailFromCreateResponse,
  openNote as openNoteApi,
  patchNote,
} from '@/utils/noteApi'
import type { NoteDetail, NotePatchBody } from '@/types/notes'

const defaultQuery: Required<NotesQuery> = {
  page: 1,
  limit: 20,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  filter: 'recentlyUpdated',
}

export const useNotesStore = defineStore('notes', {
  state: () => ({
    noteIds: [] as string[],
    notesById: {} as Record<string, NoteDetail>,
    meta: null as PaginationMeta | null,
    loadedFolderId: null as string | null,
    isLoading: false,
    isCreating: false,
    isSaving: false,
    saveError: null as string | null,
    error: null as string | null,
  }),

  getters: {
    notesInOrder(state): NoteDetail[] {
      return state.noteIds
        .map((id) => state.notesById[id])
        .filter((note): note is NoteDetail => Boolean(note))
    },

    getNote:
      (state) =>
      (noteId: string): NoteDetail | undefined =>
        state.notesById[noteId],
  },

  actions: {
    reset() {
      this.noteIds = []
      this.notesById = {}
      this.meta = null
      this.loadedFolderId = null
      this.error = null
      this.isLoading = false
      this.isCreating = false
      this.isSaving = false
      this.saveError = null
    },

    async createNote(folderId: string, title = 'Untitled') {
      if (!folderId) {
        throw new Error('No folder selected')
      }

      this.isCreating = true
      this.error = null

      try {
        const response = await createNoteInFolder(folderId, {
          title: title.trim() || 'Untitled',
          content: createDefaultNoteContent(),
        })
        const createdRaw = extractNoteFromResponseBody(response.data)

        if (!createdRaw?.id) {
          const payload = response.data as { message?: string }
          throw new Error(payload?.message || 'Failed to create note')
        }

        let note: NoteDetail

        try {
          note = await fetchNoteDetailSafe(createdRaw.id, {
            id: createdRaw.id,
            title: createdRaw.title ?? 'Untitled',
            folderId,
            lastEditedById: createdRaw.lastEditedById ?? '',
            createdAt: String(createdRaw.createdAt ?? new Date().toISOString()),
            updatedAt: String(createdRaw.updatedAt ?? new Date().toISOString()),
            isPinned: false,
            pinnedAt: null,
            lastInteractedAt: null,
            recentEditors: [],
            totalEditorCount: 0,
          })
        } catch {
          note = noteDetailFromCreateResponse(createdRaw, folderId)
        }

        this.notesById[note.id] = note
        if (!this.noteIds.includes(note.id)) {
          this.noteIds.unshift(note.id)
        }
        this.loadedFolderId = folderId
        return note
      } catch (caught) {
        const error = unwrapCaught(caught)
        if (error && typeof error === 'object' && 'response' in error) {
          const data = (error as { response?: { data?: { message?: string } } })
            .response?.data
          if (data?.message) {
            throw new Error(data.message)
          }
        }
        if (error instanceof Error) throw error
        throw new Error('Failed to create note')
      } finally {
        this.isCreating = false
      }
    },

    async fetchFolderNotes(
      folderId: string,
      query: NotesQuery = {},
      opts?: { force?: boolean },
    ) {
      if (!folderId) {
        this.reset()
        return
      }

      if (
        !opts?.force &&
        this.loadedFolderId === folderId &&
        !this.error
      ) {
        return
      }

      const params = { ...defaultQuery, ...query }
      this.isLoading = true
      this.error = null

      try {
        const listResponse = await listFolderNotes(folderId, params)
        const listPayload = listResponse.data

        if (!listPayload?.success) {
          throw new Error(listPayload?.message || 'Failed to fetch notes')
        }

        const listItems = listPayload.data ?? []
        this.noteIds = listItems.map((item) => item.id)
        this.meta = listPayload.meta ?? null
        this.loadedFolderId = folderId
        this.notesById = {}

        if (listItems.length === 0) {
          return
        }

        const detailResults = await Promise.allSettled(
          listItems.map((item) => fetchNoteDetailSafe(item.id, item)),
        )

        const nextById: Record<string, NoteDetail> = {}

        detailResults.forEach((result, index) => {
          const listItem = listItems[index]
          if (!listItem) return

          if (result.status === 'fulfilled') {
            nextById[listItem.id] = result.value
          } else {
            nextById[listItem.id] = {
              ...listItem,
              content: [],
              contentVersion: 0,
              coverMediaId: null,
            }
          }
        })

        this.notesById = nextById
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : 'Failed to fetch notes'
        this.noteIds = []
        this.notesById = {}
        this.meta = null
        this.loadedFolderId = null
      } finally {
        this.isLoading = false
      }
    },

    async ensureNote(noteId: string) {
      if (this.notesById[noteId]) {
        return this.notesById[noteId]
      }

      const note = await fetchNoteDetailSafe(noteId)
      this.notesById[noteId] = note
      if (!this.noteIds.includes(noteId)) {
        this.noteIds.push(noteId)
      }
      return note
    },

    async updateNote(noteId: string, patch: NotePatchBody) {
      this.isSaving = true
      this.saveError = null

      try {
        const updated = await patchNote(noteId, patch)
        const existing = this.notesById[noteId]
        this.notesById[noteId] = {
          ...existing,
          ...updated,
          recentEditors: updated.recentEditors ?? existing?.recentEditors ?? [],
          totalEditorCount:
            updated.totalEditorCount ?? existing?.totalEditorCount ?? 0,
        }
        return this.notesById[noteId]
      } catch (error) {
        this.saveError =
          error instanceof Error ? error.message : 'Failed to save note'
        throw error
      } finally {
        this.isSaving = false
      }
    },

    async openNote(noteId: string) {
      try {
        await openNoteApi(noteId)
      } catch {
        // Non-blocking: opening a note is analytics/presence only
      }
    },
  },
})
