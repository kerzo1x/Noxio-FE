import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { isRetriableApiError, toError, unwrapCaught } from '@/types/errors'
import { useNotesStore } from '@/stores/notes'
import type { NoteBlock, NoteDetail } from '@/types/notes'
import {
  blocksSnapshotEqual,
  cloneBlocks,
  createDefaultNoteContent,
  normalizeBlocksForApi,
} from '@/utils/noteContent'
import { validateNoteBlocks } from '@/utils/validateNoteBlocks'

const SAVE_DEBOUNCE_MS = 600
const SAVE_RETRY_MS = 2000

export function useNoteEditorDraft(note: Ref<NoteDetail | null | undefined>) {
  const notesStore = useNotesStore()

  const title = ref('')
  const content = ref<NoteBlock[]>(createDefaultNoteContent())
  const remoteConflict = ref(false)
  const validationWarnings = ref<string[]>([])
  const serverSyncGeneration = ref(0)

  let serverTitle = ''
  let serverContent: NoteBlock[] = createDefaultNoteContent()
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let saveGeneration = 0

  function syncFromNote(next: NoteDetail | null | undefined) {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }

    if (!next) {
      title.value = ''
      content.value = createDefaultNoteContent()
      serverTitle = ''
      serverContent = createDefaultNoteContent()
      remoteConflict.value = false
      validationWarnings.value = []
      return
    }

    const normalizedContent = normalizeBlocksForApi(
      next.content?.length ? next.content : createDefaultNoteContent(),
    )

    title.value = next.title || 'Untitled'
    content.value = cloneBlocks(normalizedContent)
    serverTitle = title.value
    serverContent = cloneBlocks(normalizedContent)
    remoteConflict.value = false
    validationWarnings.value = []
    serverSyncGeneration.value += 1
  }

  const isDirty = computed(() => {
    const trimmedTitle = title.value.trim() || 'Untitled'
    const serverTrimmed = serverTitle.trim() || 'Untitled'
    return (
      trimmedTitle !== serverTrimmed ||
      !blocksSnapshotEqual(content.value, serverContent)
    )
  })

  watch(
    () => [note.value?.id, note.value?.contentVersion] as const,
    ([id, version], previous) => {
      if (!id) {
        syncFromNote(null)
        return
      }

      const idChanged = !previous || previous[0] !== id
      const versionChanged = previous != null && previous[1] !== version

      if (idChanged) {
        syncFromNote(note.value)
        return
      }

      if (versionChanged && isDirty.value && !notesStore.isSaving) {
        remoteConflict.value = true
        return
      }

      if (versionChanged && !isDirty.value && !notesStore.isSaving) {
        syncFromNote(note.value)
      }
    },
    { immediate: true },
  )

  function scheduleSave() {
    if (!note.value?.id || !isDirty.value) return

    if (saveTimer) clearTimeout(saveTimer)

    saveTimer = setTimeout(() => {
      saveTimer = null
      void flushSave()
    }, SAVE_DEBOUNCE_MS)
  }

  async function attemptSave(): Promise<{ ok: boolean; error?: Error }> {
    const noteId = note.value?.id
    if (!noteId || !isDirty.value) return { ok: true }

    const generation = ++saveGeneration
    const payloadTitle = title.value.trim() || 'Untitled'
    const validated = validateNoteBlocks(content.value)
    validationWarnings.value = validated.warnings
    const payloadContent = validated.blocks

    try {
      await notesStore.updateNote(noteId, {
        title: payloadTitle,
        content: payloadContent,
      })

      if (generation !== saveGeneration) return { ok: true }

      serverTitle = payloadTitle
      serverContent = cloneBlocks(payloadContent)
      content.value = cloneBlocks(payloadContent)
      remoteConflict.value = false
      return { ok: true }
    } catch (caught) {
      const error = toError(unwrapCaught(caught))
      console.error('Failed to save note:', error)
      return { ok: false, error }
    }
  }

  async function flushSave(): Promise<boolean> {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }

    const first = await attemptSave()
    if (first.ok) return true
    if (!isRetriableApiError(first.error)) return false

    await new Promise((resolve) => setTimeout(resolve, SAVE_RETRY_MS))
    const second = await attemptSave()
    return second.ok
  }

  function setTitle(next: string) {
    title.value = next
    scheduleSave()
  }

  function setContent(next: NoteBlock[], warnings: string[] = []) {
    content.value = next
    if (warnings.length > 0) {
      validationWarnings.value = warnings
    }
    scheduleSave()
  }

  function dismissConflict() {
    remoteConflict.value = false
  }

  function acceptRemoteVersion() {
    remoteConflict.value = false
    syncFromNote(note.value)
  }

  onBeforeUnmount(() => {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    void flushSave()
  })

  watch(
    () => note.value?.id,
    async (_nextId, prevId) => {
      if (prevId) {
        await flushSave()
      }
    },
  )

  return {
    title,
    content,
    remoteConflict,
    validationWarnings,
    serverSyncGeneration,
    isDirty,
    isSaving: computed(() => notesStore.isSaving),
    saveError: computed(() => notesStore.saveError),
    setTitle,
    setContent,
    dismissConflict,
    acceptRemoteVersion,
    flushSave,
    scheduleSave,
  }
}
