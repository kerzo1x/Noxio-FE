<script setup lang="ts">
import type { Editor } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { onBeforeUnmount, ref, watch } from 'vue'
import { createNoteEditorExtensions } from '@/editor/noteEditorSchema'
import type { NoteBlock } from '@/types/notes'
import { noteBlocksToTiptap, tiptapJsonToNoteBlocksWithWarnings } from '@/utils/tiptapNoteAdapter'
import { canInsertTopLevelBlock } from '@/utils/validateNoteBlocks'

const props = defineProps<{
  blocks: NoteBlock[]
  noteId?: string | null
  serverSyncGeneration?: number
}>()

const emit = defineEmits<{
  'update:blocks': [NoteBlock[], string[]]
  blockLimitReached: []
}>()

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
  content: noteBlocksToTiptap(props.blocks),
  editorProps: {
    attributes: {
      class:
        'note-tiptap-editor min-h-[200px] flex-1 pl-8 outline-none text-white/75 [&_.note-editor-block-selected]:rounded [&_.note-editor-block-selected]:bg-white/5',
    },
    handleKeyDown(view, event) {
      if (event.key !== 'Enter' || event.shiftKey) return false
      const topLevelCount = view.state.doc.childCount
      if (!canInsertTopLevelBlock(topLevelCount)) {
        if (!limitToastShown.value) {
          limitToastShown.value = true
          emit('blockLimitReached')
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
    emit('update:blocks', result.blocks, result.warnings)
  },
  onSelectionUpdate: ({ editor: ed }) => {
    updateBlockSizeFromSelection(ed)
  },
  onTransaction: ({ editor: ed }) => {
    updateMarkState(ed)
  },
  onCreate: ({ editor: ed }) => {
    updateBlockSizeFromSelection(ed)
    loadBlocks(props.blocks)
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

watch(
  () => props.noteId,
  () => {
    loadBlocks(props.blocks)
  },
)

watch(
  () => props.serverSyncGeneration,
  () => {
    loadBlocks(props.blocks)
  },
)

watch(
  () => props.blocks,
  (next) => {
    if (!props.noteId || editor.value?.isFocused) return
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
  if (!editor.value) return props.blocks
  return tiptapJsonToNoteBlocksWithWarnings(editor.value.getJSON()).blocks
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})

function getBlockSize(): 'small' | 'medium' | 'large' {
  return blockSizeForToolbar.value
}

defineExpose({
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
})
</script>

<template>
  <div class="note-tiptap-root relative flex min-h-[200px] flex-1 flex-col">
    <EditorContent
      v-if="editor"
      :editor="editor"
      class="flex flex-1 flex-col"
    />
  </div>
</template>

<style>
.note-tiptap-editor .backendParagraph,
.note-tiptap-editor p {
  margin: 0.25rem 0;
}

.note-tiptap-editor .note-editor-bullet-list {
  padding-left: 1.25rem;
  margin: 0.25rem 0;
}

.note-tiptap-editor ul {
  list-style-type: disc;
}

.note-tiptap-editor li {
  margin: 0.125rem 0;
}

.note-drag-handle {
  position: absolute;
  z-index: 20;
  display: none;
  width: 20px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.35);
  cursor: grab;
  user-select: none;
}

.note-drag-handle.visible {
  display: flex;
}

.note-drag-handle:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
}

.note-drag-handle:active {
  cursor: grabbing;
}

.note-block-hover-overlay {
  position: absolute;
  z-index: 10;
  display: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  pointer-events: none;
}

.note-tiptap-editor .note-block-dragging {
  opacity: 0.3;
  transition: opacity 0.15s ease;
}

.note-drop-indicator {
  position: absolute;
  z-index: 30;
  display: none;
  height: 2px;
  border-radius: 1px;
  background: #3b82f6;
  box-shadow: 0 0 4px rgba(59, 130, 246, 0.6);
  pointer-events: none;
  transition:
    top 0.12s ease,
    left 0.12s ease,
    width 0.12s ease;
}

.note-tiptap-editor .note-block-drop-in {
  animation: note-block-drop-in 0.3s ease;
}

@keyframes note-block-drop-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
