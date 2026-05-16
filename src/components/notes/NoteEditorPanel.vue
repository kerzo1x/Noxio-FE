<script setup lang="ts">
import { computed } from 'vue'
import { noteBlocksToPlainParagraphs } from '@/utils/noteContent'
import type { NoteDetail } from '@/types/notes'

const props = defineProps<{
  note?: NoteDetail | null
}>()

const paragraphs = computed(() =>
  props.note ? noteBlocksToPlainParagraphs(props.note.content) : [],
)
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
      <h2 class="shrink-0 text-4xl font-semibold leading-tight tracking-tight text-white">
        {{ note.title }}
      </h2>

      <div
        v-if="paragraphs.length === 0"
        class="text-base text-white/50"
      >
        This note has no content yet.
      </div>

      <div
        v-else
        class="flex flex-col gap-4"
      >
        <p
          v-for="(paragraph, index) in paragraphs"
          :key="index"
          class="text-base leading-relaxed text-white/75"
          :class="index === 0 ? 'text-xl' : 'text-sm'"
        >
          {{ paragraph }}
        </p>
      </div>
    </div>
  </section>
</template>
