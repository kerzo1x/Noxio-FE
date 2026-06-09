<script setup lang="ts">
import { formatEdupageHm } from '@/utils/edupageTime'
import { subjectAbbrev } from '@/utils/subjectAbbrev'
import type { TimetableSlotGroup } from '@/utils/edupageTimetable'

defineProps<{
  group: TimetableSlotGroup
}>()

function formatSlotRange(start: Date, end: Date): string {
  return `${formatEdupageHm(start)}–${formatEdupageHm(end)}`
}
</script>

<template>
  <div
    class="flex min-h-[118px] min-w-[72px] flex-col border-r border-black/40 px-1 py-1 last:border-r-0 sm:min-w-[88px] sm:px-2"
  >
    <span class="shrink-0 text-center text-[11px] leading-tight text-white/45">
      {{ group.slotIndex }}
    </span>
    <div class="flex min-h-0 flex-1 flex-col justify-center gap-0">
      <template v-if="group.lessons.length === 1">
        <div class="flex flex-1 flex-col items-center justify-center px-0.5">
          <span
            class="text-center text-[15px] font-semibold leading-tight tracking-tight text-white sm:text-base"
          >
            {{ subjectAbbrev(group.lessons[0].subject) }}
          </span>
        </div>
      </template>
      <template v-else>
        <div
          v-for="lesson in group.lessons"
          :key="lesson.id"
          class="flex min-h-0 flex-1 flex-col items-center justify-center border-t border-white/8 px-0.5 py-1 first:border-t-0 first:pt-0"
        >
          <span
            class="text-center text-[13px] font-semibold leading-tight text-white sm:text-[14px]"
          >
            {{ subjectAbbrev(lesson.subject) }}
          </span>
        </div>
      </template>
    </div>
    <span
      class="shrink-0 text-center text-[10px] leading-tight text-white/40 sm:text-[11px]"
    >
      {{ formatSlotRange(group.start, group.end) }}
    </span>
  </div>
</template>
