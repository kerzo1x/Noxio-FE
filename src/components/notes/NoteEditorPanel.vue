<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import NoteBlockList from '@/components/notes/editor/NoteBlockList.vue'
import NoteFormatToolbar from '@/components/notes/editor/NoteFormatToolbar.vue'
import NoteTitleField from '@/components/notes/editor/NoteTitleField.vue'
import { useNoteEditorDraft } from '@/composables/useNoteEditorDraft'
import type { NoteBlockSize, NoteDetail } from '@/types/notes'
import { createParagraph } from '@/utils/noteContent'

const props = defineProps<{
  note?: NoteDetail | null
}>()

const noteRef = toRef(props, 'note')
const blockListRef = ref<InstanceType<typeof NoteBlockList> | null>(null)

const {
  title,
  content,
  focusedBlockIndex,
  focusedBlockSize,
  focusedBlockBold,
  isSaving,
  saveError,
  setTitle,
  setContent,
  insertBlockAfter,
  removeBlock,
  mergeWithPrevious,
  setFocusedBlock,
  applyBold,
  applySize,
} = useNoteEditorDraft(noteRef)

const showToolbar = computed(() => focusedBlockIndex.value !== null)

function onBlocksUpdate(blocks: typeof content.value) {
  setContent(blocks)
}

function onEnterAfter(index: number) {
  insertBlockAfter(index, createParagraph())
  setFocusedBlock(index + 1, null)
  blockListRef.value?.focusParagraph(index + 1)
}

function onBackspaceEmpty(index: number) {
  if (index === 0) {
    removeBlock(index)
    setFocusedBlock(0, null)
    blockListRef.value?.focusParagraph(0)
    return
  }

  mergeWithPrevious(index)
  setFocusedBlock(index - 1, null)
  blockListRef.value?.focusParagraph(index - 1)
}

function onToolbarSize(size: NoteBlockSize) {
  applySize(size)
}

function onToolbarBold() {
  applyBold()
}
</script>

<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden border-l border-[#212121] pl-6">
    <div
      v-if="!note"
      class="flex flex-1 items-center justify-center"
    >
      <p class="text-sm font-bold text-white/50">
        Open a document to start editing
      </p>
    </div>

    <div
      v-else
      class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <NoteTitleField
        :model-value="title"
        @update:model-value="setTitle"
      />

      <NoteFormatToolbar
        v-if="showToolbar"
        :size="focusedBlockSize"
        :bold="focusedBlockBold"
        @update:size="onToolbarSize"
        @toggle-bold="onToolbarBold"
      />

      <NoteBlockList
        ref="blockListRef"
        :blocks="content"
        :focused-block-index="focusedBlockIndex"
        @update:blocks="onBlocksUpdate"
        @focus-block="(index, listItemIndex) => setFocusedBlock(index, listItemIndex)"
        @enter-after="onEnterAfter"
        @backspace-empty="onBackspaceEmpty"
      />

      <p
        v-if="isSaving"
        class="text-xs text-white/40"
      >
        Saving…
      </p>
      <p
        v-else-if="saveError"
        class="text-xs text-red-400"
      >
        {{ saveError }}
      </p>
    </div>
  </section>
</template>
