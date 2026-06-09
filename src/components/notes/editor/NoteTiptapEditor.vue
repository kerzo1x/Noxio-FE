<script setup lang="ts">
import { EditorContent } from '@tiptap/vue-3'
import { toRef } from 'vue'
import { useTiptapNoteEditor } from '@/composables/useTiptapNoteEditor'
import type { NoteBlock } from '@/types/notes'

const props = defineProps<{
  blocks: NoteBlock[]
  noteId?: string | null
  serverSyncGeneration?: number
}>()

const emit = defineEmits<{
  'update:blocks': [NoteBlock[], string[]]
  blockLimitReached: []
}>()

const {
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
} = useTiptapNoteEditor({
  blocks: toRef(props, 'blocks'),
  noteId: toRef(props, 'noteId'),
  serverSyncGeneration: toRef(props, 'serverSyncGeneration'),
  onUpdateBlocks: (blocks, warnings) => emit('update:blocks', blocks, warnings),
  onBlockLimitReached: () => emit('blockLimitReached'),
})

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
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.35);
  cursor: grab;
  user-select: none;
  touch-action: none;
  transition:
    top 0.1s ease,
    left 0.1s ease;
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

body.note-block-grabbing,
body.note-block-grabbing * {
  cursor: grabbing !important;
  user-select: none !important;
}

.note-block-hover-overlay {
  position: absolute;
  z-index: 10;
  display: none;
  border-radius: 8px;
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
