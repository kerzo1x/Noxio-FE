<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import NotesSplitLayout from '@/components/notes/NotesSplitLayout.vue'
import NotesListPanel from '@/components/notes/NotesListPanel.vue'
import NoteEditorPanel from '@/components/notes/NoteEditorPanel.vue'
import { useNotesStore } from '@/stores/notes'

const props = defineProps<{
  folderId: string
  noteId?: string
}>()

const router = useRouter()
const notesStore = useNotesStore()

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
    if (!props.noteId || notesStore.loadedFolderId !== props.folderId) return
    if (!notesStore.isLoading && !notesStore.noteIds.includes(props.noteId)) {
      router.replace({
        name: 'DashboardFolderNotes',
        params: { folderId: props.folderId },
      })
    }
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
  },
  { immediate: true },
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
  <section class="flex h-full min-h-0 w-full flex-col">
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
