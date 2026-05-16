<script setup lang="ts">
import { computed } from 'vue'
import defaultAvatar from '@/assets/img/user.svg'
import { extractPreviewText } from '@/utils/noteContent'
import type { NoteDetail } from '@/types/notes'

const props = defineProps<{
  note: NoteDetail
  selected?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

const preview = computed(() => extractPreviewText(props.note.content))

const visibleEditors = computed(
  () => props.note.recentEditors?.slice(0, 3) ?? [],
)
</script>

<template>
  <button
    type="button"
    class="flex w-full max-w-[20.9375rem] min-h-36 cursor-pointer flex-col justify-between gap-2 rounded-lg border p-5 text-left transition-colors"
    :class="
      selected
        ? 'border-2 border-[rgba(76,76,76,0.52)] bg-black text-white'
        : 'border-[#222222] bg-[#2e2e2e] text-white hover:bg-[#333333]'
    "
    @click="emit('click')"
  >
    <div class="flex min-h-0 flex-1 flex-col gap-2">
      <h3 class="text-sm font-bold leading-snug">
        {{ note.title }}
      </h3>
      <p class="line-clamp-3 flex-1 text-xs leading-normal text-white/50">
        {{ preview || 'No preview' }}
      </p>
    </div>

    <div
      v-if="visibleEditors.length"
      class="flex items-center justify-end"
    >
      <span
        v-for="(editor, index) in visibleEditors"
        :key="editor.userId"
        class="relative size-4 overflow-hidden rounded-full border border-black bg-panel-input-bg"
        :style="{ marginLeft: index === 0 ? '0' : '-0.35rem', zIndex: index }"
      >
        <img
          :src="editor.avatarUrl || defaultAvatar"
          alt=""
          class="size-full object-cover"
        />
      </span>
    </div>
  </button>
</template>
