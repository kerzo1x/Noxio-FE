<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import NotesSplitLayout from '@/components/notes/NotesSplitLayout.vue'
import NotesListPanel from '@/components/notes/NotesListPanel.vue'
import NoteEditorPanel from '@/components/notes/NoteEditorPanel.vue'
import { useNotesStore } from '@/stores/notes'
import { useWorkspaceStore } from '@/stores/workspace'
import {
  getLastNotesContext,
  rememberFolder,
  rememberNote,
} from '@/utils/lastNotesContext'

const props = defineProps<{
  folderId: string
  noteId?: string
}>()

const router = useRouter()
const notesStore = useNotesStore()
const workspaceStore = useWorkspaceStore()

const selectedNoteId = computed(() => props.noteId ?? null)

const selectedNote = computed(() => {
  const id = selectedNoteId.value
  if (!id) return null
  return notesStore.getNote(id) ?? null
})

watch(
  () => props.folderId,
  async (folderId, previousFolderId) => {
    if (!folderId) {
      notesStore.reset()
      return
    }

    if (previousFolderId && previousFolderId !== folderId && props.noteId) {
      await router.replace({
        name: 'DashboardFolderNotes',
        params: { folderId },
      })
    }

    if (notesStore.loadedFolderId !== folderId) {
      await notesStore.fetchFolderNotes(folderId)
    }
  },
  { immediate: true },
)

watch(
  () => [props.noteId, props.folderId, notesStore.noteIds] as const,
  () => {
    // If the current noteId isn't present in `noteIds` (because the list may be
    // filtered), we rely on the `props.noteId` watcher below to call
    // `notesStore.ensureNote(noteId)`.
  },
)

watch(
  () => props.noteId,
  async (noteId) => {
    if (!noteId) return
    if (!notesStore.getNote(noteId)) {
      try {
        await notesStore.ensureNote(noteId)
      } catch (error) {
        console.error('Failed to load note:', error)
      }
    }

    const note = notesStore.getNote(noteId)
    if (!note) {
      // If we couldn't load the note, fall back to the folder view.
      await router.replace({
        name: 'DashboardFolderNotes',
        params: { folderId: props.folderId },
      })
      return
    }

    // Safety: if the note doesn't belong to the current folder, don't keep it selected.
    if (note.folderId !== props.folderId) {
      await router.replace({
        name: 'DashboardFolderNotes',
        params: { folderId: props.folderId },
      })
      return
    }

    void notesStore.openNote(noteId)
  },
  { immediate: true },
)

watch(
  () => [props.folderId, props.noteId] as const,
  ([folderId, noteId]) => {
    const workspaceId = workspaceStore.activeWorkspace?.id
    if (!workspaceId || !folderId) return

    if (noteId) {
      rememberNote(workspaceId, folderId, noteId)
      return
    }

    rememberFolder(workspaceId, folderId)
  },
  { immediate: true },
)

watch(
  () =>
    [
      props.folderId,
      props.noteId,
      notesStore.isLoading,
      notesStore.loadedFolderId,
      notesStore.noteIds.join(','),
    ] as const,
  ([folderId, noteId, isLoading, loadedFolderId, noteIdsKey]) => {
    if (!folderId || noteId || isLoading || loadedFolderId !== folderId) return
    if (!noteIdsKey) return

    const workspaceId = workspaceStore.activeWorkspace?.id
    const last = workspaceId ? getLastNotesContext(workspaceId) : null

    const preferredNoteId =
      last?.folderId === folderId &&
      last.noteId
        ? last.noteId
        : notesStore.noteIds[0]

    if (!preferredNoteId) return

    void router.replace({
      name: 'DashboardFolderNotes',
      params: { folderId, noteId: preferredNoteId },
    })
  },
)

function handleSelectNote(noteId: string) {
  router.push({
    name: 'DashboardFolderNotes',
    params: {
      folderId: props.folderId,
      noteId,
    },
  })
}

async function handleCreateNote() {
  if (notesStore.isCreating) return

  try {
    const note = await notesStore.createNote(props.folderId)
    await router.push({
      name: 'DashboardFolderNotes',
      params: {
        folderId: props.folderId,
        noteId: note.id,
      },
    })
  } catch (error) {
    console.error('Failed to create note:', error)
    notesStore.error =
      error instanceof Error ? error.message : 'Failed to create note'
  }
}
</script>

<template>
  <section class="dashboard-page-column">
    <NotesSplitLayout>
      <template #list>
        <NotesListPanel
          :notes="notesStore.notesInOrder"
          :selected-note-id="selectedNoteId"
          :is-loading="notesStore.isLoading"
          :is-creating="notesStore.isCreating"
          :error="notesStore.error"
          @select="handleSelectNote"
          @create="handleCreateNote"
        />
      </template>

      <template #editor>
        <NoteEditorPanel :note="selectedNote" />
      </template>
    </NotesSplitLayout>
  </section>
</template>
