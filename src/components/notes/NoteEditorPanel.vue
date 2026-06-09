<script setup lang="ts">
import { computed, onBeforeUnmount, ref, toRef } from 'vue'
import NoteBlockList from '@/components/notes/editor/NoteBlockList.vue'
import NoteFormatToolbar from '@/components/notes/editor/NoteFormatToolbar.vue'
import NoteTitleField from '@/components/notes/editor/NoteTitleField.vue'
import { useNoteEditorDraft } from '@/composables/useNoteEditorDraft'
import type { NoteBlockSize, NoteDetail } from '@/types/notes'
import { isBulletedList } from '@/utils/noteContent'

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
  setFocusedBlock,
  applyBold,
  applySize,
} = useNoteEditorDraft(noteRef)

const showToolbar = computed(() => focusedBlockIndex.value !== null)

function onBlocksUpdate(blocks: typeof content.value) {
  setContent(blocks)
}

function onToolbarSize(size: NoteBlockSize) {
  blockListRef.value?.flushPendingInput()
  applySize(size)
}

function onToolbarBold() {
  blockListRef.value?.flushPendingInput()
  applyBold()
}

onBeforeUnmount(() => {
  blockListRef.value?.flushPendingInput()
})

function onEditorSurfaceMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.closest('[contenteditable="true"]')) return

  event.preventDefault()

  const lastIndex = content.value.length - 1
  if (lastIndex < 0) return

  const block = content.value[lastIndex]
  const listItemIndex = block && isBulletedList(block) ? block.items.length - 1 : null

  setFocusedBlock(lastIndex, listItemIndex)
  void blockListRef.value?.focusBlockAtEnd(lastIndex)
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
      class="flex min-h-0 flex-1 flex-col"
    >
      <div
        class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <NoteTitleField
          :model-value="title"
          @update:model-value="setTitle"
        />

        <NoteTiptapEditor
          :key="`${note.id}-${serverSyncGeneration}`"
          ref="editorRef"
          :blocks="content"
          :note-id="note.id"
          :server-sync-generation="serverSyncGeneration"
          @update:blocks="onBlocksUpdate"
          @block-limit-reached="onBlockLimitReached"
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

      <div
        v-if="showToolbar"
        class="flex shrink-0 justify-center pb-6 pt-2"
      >
        <NoteFormatToolbar
          :size="focusedBlockSize"
          :bold="focusedBlockBold"
          @update:size="onToolbarSize"
          @toggle-bold="onToolbarBold"
        />
      </div>
    </div>
  </section>
</template>
