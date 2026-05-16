import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { useNotesStore } from '@/stores/notes'
import type { NoteBlock, NoteBlockSize, NoteDetail } from '@/types/notes'
import {
  blocksSnapshotEqual,
  cloneBlocks,
  createDefaultNoteContent,
  getBlockSize,
  isBlockBold,
  normalizeBlocksForApi,
  setBlockSize,
  toggleBlockBold,
} from '@/utils/noteContent'

const SAVE_DEBOUNCE_MS = 600

export function useNoteEditorDraft(note: Ref<NoteDetail | null | undefined>) {
  const notesStore = useNotesStore()

  const title = ref('')
  const content = ref<NoteBlock[]>(createDefaultNoteContent())
  const focusedBlockIndex = ref<number | null>(null)
  const focusedListItemIndex = ref<number | null>(null)

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
      focusedBlockIndex.value = null
      focusedListItemIndex.value = null
      return
    }

    const normalizedContent = normalizeBlocksForApi(
      next.content?.length ? next.content : createDefaultNoteContent(),
    )

    title.value = next.title || 'Untitled'
    content.value = cloneBlocks(normalizedContent)
    serverTitle = title.value
    serverContent = cloneBlocks(normalizedContent)
    focusedBlockIndex.value = null
    focusedListItemIndex.value = null
  }

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

      if (versionChanged && !isDirty.value && !notesStore.isSaving) {
        syncFromNote(note.value)
      }
    },
    { immediate: true },
  )

  const focusedBlock = computed(() => {
    const index = focusedBlockIndex.value
    if (index === null) return null
    return content.value[index] ?? null
  })

  const focusedBlockSize = computed<NoteBlockSize>(() => {
    const block = focusedBlock.value
    return block ? getBlockSize(block) : 'medium'
  })

  const focusedBlockBold = computed(() => {
    const block = focusedBlock.value
    return block ? isBlockBold(block) : false
  })

  const isDirty = computed(() => {
    const trimmedTitle = title.value.trim() || 'Untitled'
    const serverTrimmed = serverTitle.trim() || 'Untitled'
    return (
      trimmedTitle !== serverTrimmed ||
      !blocksSnapshotEqual(content.value, serverContent)
    )
  })

  function scheduleSave() {
    if (!note.value?.id || !isDirty.value) return

    if (saveTimer) clearTimeout(saveTimer)

    saveTimer = setTimeout(() => {
      saveTimer = null
      void flushSave()
    }, SAVE_DEBOUNCE_MS)
  }

  async function flushSave() {
    const noteId = note.value?.id
    if (!noteId || !isDirty.value) return

    const generation = ++saveGeneration
    const payloadTitle = title.value.trim() || 'Untitled'
    const payloadContent = normalizeBlocksForApi(content.value)

    try {
      await notesStore.updateNote(noteId, {
        title: payloadTitle,
        content: payloadContent,
      })

      if (generation !== saveGeneration) return

      serverTitle = payloadTitle
      serverContent = cloneBlocks(payloadContent)
    } catch (error) {
      console.error('Failed to save note:', error)
    }
  }

  function setTitle(next: string) {
    title.value = next
    scheduleSave()
  }

  function setContent(next: NoteBlock[]) {
    content.value = next
    scheduleSave()
  }

  function updateBlock(index: number, block: NoteBlock) {
    const next = [...content.value]
    next[index] = block
    content.value = next
    scheduleSave()
  }

  function insertBlockAfter(index: number, block: NoteBlock) {
    const next = [...content.value]
    next.splice(index + 1, 0, block)
    content.value = next
    scheduleSave()
  }

  function removeBlock(index: number) {
    if (content.value.length <= 1) {
      content.value = createDefaultNoteContent()
      scheduleSave()
      return
    }

    const next = content.value.filter((_, i) => i !== index)
    content.value = next
    scheduleSave()
  }

  function mergeWithPrevious(index: number) {
    if (index <= 0) return
    removeBlock(index)
  }

  function setFocusedBlock(index: number | null, listItemIndex: number | null = null) {
    focusedBlockIndex.value = index
    focusedListItemIndex.value = listItemIndex
  }

  function applyBold() {
    const index = focusedBlockIndex.value
    if (index === null) return

    const block = content.value[index]
    if (!block) return

    updateBlock(index, toggleBlockBold(block))
  }

  function applySize(size: NoteBlockSize) {
    const index = focusedBlockIndex.value
    if (index === null) return

    const block = content.value[index]
    if (!block) return

    updateBlock(index, setBlockSize(block, size))
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
    focusedBlockIndex,
    focusedListItemIndex,
    focusedBlockSize,
    focusedBlockBold,
    isDirty,
    isSaving: computed(() => notesStore.isSaving),
    saveError: computed(() => notesStore.saveError),
    setTitle,
    setContent,
    updateBlock,
    insertBlockAfter,
    removeBlock,
    mergeWithPrevious,
    setFocusedBlock,
    applyBold,
    applySize,
    flushSave,
    scheduleSave,
  }
}
