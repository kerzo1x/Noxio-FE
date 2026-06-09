<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useRouter } from 'vue-router'
import NotesSplitLayout from '@/components/notes/NotesSplitLayout.vue'
import NotesListPanel from '@/components/notes/NotesListPanel.vue'
import NoteEditorPanel from '@/components/notes/NoteEditorPanel.vue'
import { useNotesRoute } from '@/composables/useNotesRoute'
import { useNotesStore } from '@/stores/notes'
import { useWorkspaceStore } from '@/stores/workspace'

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

useNotesRoute({
  folderId: toRef(props, 'folderId'),
  noteId: toRef(props, 'noteId'),
  router,
  notesStore,
  workspaceStore,
})

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
  <section class="dashboard-page-column max-w-none">
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
