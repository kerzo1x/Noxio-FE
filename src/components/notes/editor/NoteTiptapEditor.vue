<script setup lang="ts">
import type { Editor } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import { onBeforeUnmount, ref, watch } from 'vue'
import { createNoteEditorExtensions } from '@/editor/noteEditorSchema'
import type { NoteBlock } from '@/types/notes'
import { noteBlocksToTiptap, tiptapJsonToNoteBlocksWithWarnings } from '@/utils/tiptapNoteAdapter'
import { canInsertTopLevelBlock } from '@/utils/validateNoteBlocks'

const COLOR_PRESETS = [
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#71717a',
] as const

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
        'note-tiptap-editor min-h-[200px] flex-1 outline-none text-white/75 [&_.note-editor-block-selected]:rounded [&_.note-editor-block-selected]:bg-white/5',
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

    <BubbleMenu
      v-if="editor"
      :editor="editor"
      :tippy-options="{ duration: 100 }"
      class="flex items-center gap-2 rounded-lg border border-black/10 bg-[#fafafa] px-3 py-2 shadow-lg"
    >
      <button
        type="button"
        class="text-sm font-bold text-black hover:opacity-70"
        @mousedown.prevent
        @click="toggleBold"
      >
        B
      </button>
      <button
        type="button"
        class="text-sm text-black underline hover:opacity-70"
        @mousedown.prevent
        @click="toggleUnderline"
      >
        U
      </button>
      <div class="flex items-center gap-1 border-l border-black/10 pl-2">
        <button
          v-for="color in COLOR_PRESETS"
          :key="color"
          type="button"
          class="size-5 rounded-full border border-black/10"
          :style="{ backgroundColor: color }"
          :title="color"
          @mousedown.prevent
          @click="setTextColor(color)"
        />
        <input
          type="color"
          class="size-5 cursor-pointer rounded border-0 bg-transparent p-0"
          title="Custom color"
          @mousedown.prevent
          @input="setTextColor(($event.target as HTMLInputElement).value)"
        >
      </div>
    </BubbleMenu>
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
</style>
