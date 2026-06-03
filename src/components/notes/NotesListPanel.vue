<script setup lang="ts">
import NoteCard from '@/components/notes/NoteCard.vue'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import type { NoteDetail } from '@/types/notes'

defineProps<{
  notes: NoteDetail[]
  selectedNoteId?: string | null
  isLoading?: boolean
  isCreating?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  select: [noteId: string]
  create: []
}>()
</script>

<template>
  <section class="flex h-full min-h-0 w-full flex-col pr-4">
    <div class="flex w-full min-h-0 max-w-[20.9375rem] flex-1 flex-col">
      <header class="mb-5 flex shrink-0 items-center justify-between gap-4">
        <h1 class="text-xl font-medium tracking-tight text-white">Notes</h1>
        <div class="h-7 w-[12.6875rem] shrink-0">
          <BaseButton
            text="New note"
            :is-loading="isCreating"
            class="!h-full !w-full !rounded-lg !px-2.5 !py-0 !text-xs !font-medium !leading-normal"
            @click="emit('create')"
          />
        </div>
      </header>

      <div
        class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          v-if="isLoading"
          class="flex items-center justify-center py-12 text-sm text-white/45"
        >
          Loading notes...
        </div>

        <p
          v-else-if="error"
          class="py-8 text-center text-sm text-red-400/80"
        >
          {{ error }}
        </p>

        <p
          v-else-if="notes.length === 0"
          class="py-8 text-center text-sm text-white/45"
        >
          No notes in this folder yet.
        </p>

        <div
          v-else
          class="flex flex-col gap-[2.4375rem] pb-4"
        >
          <NoteCard
            v-for="note in notes"
            :key="note.id"
            :note="note"
            :selected="note.id === selectedNoteId"
            @click="emit('select', note.id)"
          />
        </div>
      </div>
    </div>
  </section>
</template>
