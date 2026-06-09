import { watch, type Ref } from 'vue'
import type { Router } from 'vue-router'
import type { useNotesStore } from '@/stores/notes'
import type { useWorkspaceStore } from '@/stores/workspace'
import {
  getLastNotesContext,
  rememberFolder,
  rememberNote,
} from '@/utils/lastNotesContext'

type NotesStore = ReturnType<typeof useNotesStore>
type WorkspaceStore = ReturnType<typeof useWorkspaceStore>

export interface UseNotesRouteOptions {
  folderId: Ref<string>
  noteId: Ref<string | undefined>
  router: Router
  notesStore: NotesStore
  workspaceStore: WorkspaceStore
}

export function useNotesRoute(options: UseNotesRouteOptions) {
  const { folderId, noteId, router, notesStore, workspaceStore } = options

  watch(
    () => folderId.value,
    async (nextFolderId, previousFolderId) => {
      if (!nextFolderId) {
        notesStore.reset()
        return
      }

      if (previousFolderId && previousFolderId !== nextFolderId && noteId.value) {
        await router.replace({
          name: 'DashboardFolderNotes',
          params: { folderId: nextFolderId },
        })
      }

      if (notesStore.loadedFolderId !== nextFolderId) {
        await notesStore.fetchFolderNotes(nextFolderId)
      }
    },
    { immediate: true },
  )

  watch(
    () => noteId.value,
    async (nextNoteId) => {
      if (!nextNoteId) return
      if (!notesStore.getNote(nextNoteId)) {
        try {
          await notesStore.ensureNote(nextNoteId)
        } catch (error) {
          console.error('Failed to load note:', error)
        }
      }

      const note = notesStore.getNote(nextNoteId)
      if (!note) {
        // If we couldn't load the note, fall back to the folder view.
        await router.replace({
          name: 'DashboardFolderNotes',
          params: { folderId: folderId.value },
        })
        return
      }

      // Safety: if the note doesn't belong to the current folder, don't keep it selected.
      if (note.folderId !== folderId.value) {
        await router.replace({
          name: 'DashboardFolderNotes',
          params: { folderId: folderId.value },
        })
        return
      }

      void notesStore.openNote(nextNoteId)
    },
    { immediate: true },
  )

  watch(
    () => [folderId.value, noteId.value] as const,
    ([nextFolderId, nextNoteId]) => {
      const workspaceId = workspaceStore.activeWorkspace?.id
      if (!workspaceId || !nextFolderId) return

      if (nextNoteId) {
        rememberNote(workspaceId, nextFolderId, nextNoteId)
        return
      }

      rememberFolder(workspaceId, nextFolderId)
    },
    { immediate: true },
  )

  watch(
    () =>
      [
        folderId.value,
        noteId.value,
        notesStore.isLoading,
        notesStore.loadedFolderId,
        notesStore.noteIds.join(','),
      ] as const,
    ([nextFolderId, nextNoteId, isLoading, loadedFolderId, noteIdsKey]) => {
      if (!nextFolderId || nextNoteId || isLoading || loadedFolderId !== nextFolderId) return
      if (!noteIdsKey) return

      const workspaceId = workspaceStore.activeWorkspace?.id
      const last = workspaceId ? getLastNotesContext(workspaceId) : null

      const preferredNoteId =
        last?.folderId === nextFolderId &&
        last.noteId
          ? last.noteId
          : notesStore.noteIds[0]

      if (!preferredNoteId) return

      void router.replace({
        name: 'DashboardFolderNotes',
        params: { folderId: nextFolderId, noteId: preferredNoteId },
      })
    },
  )
}
