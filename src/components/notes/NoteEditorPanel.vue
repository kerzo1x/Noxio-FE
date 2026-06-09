<script setup lang="ts">
import { computed, onBeforeUnmount, ref, toRef } from 'vue'
import NoteFormatToolbar from '@/components/notes/editor/NoteFormatToolbar.vue'
import NoteTiptapEditor from '@/components/notes/editor/NoteTiptapEditor.vue'
import NoteTitleField from '@/components/notes/editor/NoteTitleField.vue'
import { useNoteEditorDraft } from '@/composables/useNoteEditorDraft'
import type { NoteBlockSize, NoteDetail } from '@/types/notes'

const props = defineProps<{
  note?: NoteDetail | null
}>()

const noteRef = toRef(props, 'note')
const editorRef = ref<InstanceType<typeof NoteTiptapEditor> | null>(null)
const blockLimitMessage = ref<string | null>(null)

const {
  title,
  content,
  remoteConflict,
  validationWarnings,
  serverSyncGeneration,
  isSaving,
  saveError,
  setTitle,
  setContent,
  dismissConflict,
  acceptRemoteVersion,
  flushSave,
} = useNoteEditorDraft(noteRef)

const showToolbar = computed(() => Boolean(props.note))

const currentBlockSize = computed<NoteBlockSize>(() => {
  return editorRef.value?.getBlockSize() ?? 'medium'
})

const boldActive = computed(() => editorRef.value?.boldActive ?? false)
const underlineActive = computed(() => editorRef.value?.underlineActive ?? false)

function onBlocksUpdate(blocks: typeof content.value, warnings: string[]) {
  setContent(blocks, warnings)
}

function onToolbarSize(size: NoteBlockSize) {
  editorRef.value?.applyBlockSize(size)
}

function onToolbarBold() {
  editorRef.value?.toggleBold()
}

function onToolbarUnderline() {
  editorRef.value?.toggleUnderline()
}

function onToolbarColor(color: string) {
  editorRef.value?.setTextColor(color)
}

function onAcceptRemote() {
  acceptRemoteVersion()
  editorRef.value?.loadBlocks(content.value)
}

function onBlockLimitReached() {
  blockLimitMessage.value = 'This note has reached the maximum number of blocks (500).'
  setTimeout(() => {
    blockLimitMessage.value = null
  }, 4000)
}

onBeforeUnmount(() => {
  void flushSave()
})

defineExpose({ flushSave })
</script>

<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden pl-4 pr-3">
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
        v-if="remoteConflict"
        class="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200"
      >
        <span>This note was updated elsewhere.</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded px-3 py-1 text-xs font-medium text-white/80 hover:bg-white/10"
            @click="dismissConflict"
          >
            Keep mine
          </button>
          <button
            type="button"
            class="rounded bg-white/15 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
            @click="onAcceptRemote"
          >
            Load from server
          </button>
        </div>
      </div>

      <div
        class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
          v-if="blockLimitMessage"
          class="text-xs text-amber-400"
        >
          {{ blockLimitMessage }}
        </p>
        <p
          v-for="(warning, index) in validationWarnings"
          :key="index"
          class="text-xs text-amber-400/90"
        >
          {{ warning }}
        </p>
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
          :size="currentBlockSize"
          :bold-active="boldActive"
          :underline-active="underlineActive"
          @update:size="onToolbarSize"
          @toggle-bold="onToolbarBold"
          @toggle-underline="onToolbarUnderline"
          @set-color="onToolbarColor"
        />
      </div>
    </div>
  </section>
</template>
