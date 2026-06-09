import type { Editor } from '@tiptap/core'
import { useEditor } from '@tiptap/vue-3'
import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { createNoteEditorExtensions } from '@/editor/noteEditorSchema'
import type { NoteBlock } from '@/types/notes'
import { noteBlocksToTiptap, tiptapJsonToNoteBlocksWithWarnings } from '@/utils/tiptapNoteAdapter'
import { canInsertTopLevelBlock } from '@/utils/validateNoteBlocks'

export interface UseTiptapNoteEditorOptions {
  blocks: Ref<NoteBlock[]>
  noteId?: Ref<string | null | undefined>
  serverSyncGeneration?: Ref<number | undefined>
  onUpdateBlocks: (blocks: NoteBlock[], warnings: string[]) => void
  onBlockLimitReached: () => void
}

export function useTiptapNoteEditor(options: UseTiptapNoteEditorOptions) {
  const limitToastShown = ref(false)
  const blockSizeForToolbar = ref<'small' | 'medium' | 'large'>('medium')
  const boldActive = ref(false)
  const underlineActive = ref(false)

  function updateMarkState(ed: Editor) {
    boldActive.value = ed.isActive('bold')
    underlineActive.value = ed.isActive('underline')
  }

  function updateBlockSizeFromSelection(ed: Editor) {
    const { $from } = ed.state.selection
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth)
      if (node.type.name === 'backendParagraph' || node.type.name === 'listItem') {
        blockSizeForToolbar.value = (node.attrs.size as 'small' | 'medium' | 'large') || 'medium'
        return
      }
    }
    blockSizeForToolbar.value = 'medium'
  }

  const editor = useEditor({
    extensions: createNoteEditorExtensions(),
    content: noteBlocksToTiptap(options.blocks.value),
    editorProps: {
      attributes: {
        class:
          'note-tiptap-editor min-h-[200px] flex-1 pr-10 outline-none text-white/75 [&_.note-editor-block-selected]:rounded [&_.note-editor-block-selected]:bg-white/5',
      },
      handleKeyDown(view, event) {
        if (event.key !== 'Enter' || event.shiftKey) return false
        const topLevelCount = view.state.doc.childCount
        if (!canInsertTopLevelBlock(topLevelCount)) {
          if (!limitToastShown.value) {
            limitToastShown.value = true
            options.onBlockLimitReached()
            setTimeout(() => {
              limitToastShown.value = false
            }, 3000)
          }
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor: ed }) => {
      const result = tiptapJsonToNoteBlocksWithWarnings(ed.getJSON())
      options.onUpdateBlocks(result.blocks, result.warnings)
    },
    onSelectionUpdate: ({ editor: ed }) => {
      updateBlockSizeFromSelection(ed)
    },
    onTransaction: ({ editor: ed }) => {
      updateMarkState(ed)
    },
    onCreate: ({ editor: ed }) => {
      updateBlockSizeFromSelection(ed)
      loadBlocks(options.blocks.value)
    },
  })

  function loadBlocks(blocks: NoteBlock[]) {
    if (!editor.value) return
    try {
      const doc = noteBlocksToTiptap(blocks)
      editor.value.commands.setContent(doc, { emitUpdate: false })
    } catch (error) {
      console.error('Failed to load note content into editor:', error)
    }
  }

  if (options.noteId) {
    watch(
      () => options.noteId!.value,
      () => {
        loadBlocks(options.blocks.value)
      },
    )
  }

  if (options.serverSyncGeneration) {
    watch(
      () => options.serverSyncGeneration!.value,
      () => {
        loadBlocks(options.blocks.value)
      },
    )
  }

  watch(
    () => options.blocks.value,
    (next) => {
      if (!options.noteId?.value || editor.value?.isFocused) return
      loadBlocks(next)
    },
    { deep: true },
  )

  function applyBlockSize(size: 'small' | 'medium' | 'large') {
    if (!editor.value) return
    const { $from } = editor.value.state.selection
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth)
      if (node.type.name === 'backendParagraph') {
        const pos = $from.before(depth)
        editor.value
          .chain()
          .focus()
          .setNodeSelection(pos)
          .updateAttributes('backendParagraph', { size })
          .run()
        return
      }
      if (node.type.name === 'listItem') {
        const pos = $from.before(depth)
        editor.value.chain().focus().setNodeSelection(pos).updateAttributes('listItem', { size }).run()
        return
      }
    }
  }

  function toggleBold() {
    editor.value?.chain().focus().toggleBold().run()
  }

  function toggleUnderline() {
    editor.value?.chain().focus().toggleUnderline().run()
  }

  function setTextColor(color: string) {
    editor.value?.chain().focus().setColor(color).run()
  }

  function getBlocks(): NoteBlock[] {
    if (!editor.value) return options.blocks.value
    return tiptapJsonToNoteBlocksWithWarnings(editor.value.getJSON()).blocks
  }

  onBeforeUnmount(() => {
    editor.value?.destroy()
  })

  function getBlockSize(): 'small' | 'medium' | 'large' {
    return blockSizeForToolbar.value
  }

  return {
    editor,
    boldActive,
    underlineActive,
    getBlockSize,
    applyBlockSize,
    toggleBold,
    toggleUnderline,
    setTextColor,
    getBlocks,
    loadBlocks,
  }
}
