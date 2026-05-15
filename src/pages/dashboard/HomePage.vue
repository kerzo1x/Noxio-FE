<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import type { EdupageTimetableLesson } from '@/types/edupage'
import { subjectAbbrev } from '@/utils/subjectAbbrev'
import { useFoldersStore } from '@/stores/folders'
import { useWorkspaceStore } from '@/stores/workspace'
import { useTimetableStore } from '@/stores/timetable'
import bigFolder from '@/assets/img/big-folder.svg'

const workspaceStore = useWorkspaceStore()
const foldersStore = useFoldersStore()
const timetableStore = useTimetableStore()

interface TimetableSlotGroup {
  slotIndex: number
  start: Date
  end: Date
  lessons: EdupageTimetableLesson[]
}

function isSameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function lessonsForLocalToday(
  list: EdupageTimetableLesson[],
  now: Date = new Date()
): EdupageTimetableLesson[] {
  return list.filter((l) => {
    const start = new Date(l.startTime)
    return isSameLocalCalendarDay(start, now)
  })
}

function buildSlotGroups(dayLessons: EdupageTimetableLesson[]): TimetableSlotGroup[] {
  const sorted = [...dayLessons].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )
  const clusters: EdupageTimetableLesson[][] = []
  for (const lesson of sorted) {
    const t = new Date(lesson.startTime).getTime()
    const prev = clusters[clusters.length - 1]
    if (prev && new Date(prev[0].startTime).getTime() === t) {
      prev.push(lesson)
    } else {
      clusters.push([lesson])
    }
  }
  return clusters.map((group, i) => {
    const start = new Date(group[0].startTime)
    const endMs = Math.max(...group.map((l) => new Date(l.endTime).getTime()))
    return { slotIndex: i + 1, start, end: new Date(endMs), lessons: group }
  })
}

const timetableSlotGroups = computed(() =>
  buildSlotGroups(lessonsForLocalToday(timetableStore.lessons))
)

const recentFolders = computed(() =>
  [...foldersStore.folders]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4)
)

function formatHm(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: false })
}

function formatSlotRange(start: Date, end: Date): string {
  return `${formatHm(start)}–${formatHm(end)}`
}

watch(
  () => workspaceStore.activeWorkspace?.id ?? null,
  (workspaceId) => {
    if (!workspaceId) { timetableStore.reset(); return }
    void timetableStore.fetchTimetable(workspaceId)
  }
)

onMounted(() => {
  const id = workspaceStore.activeWorkspace?.id
  if (id) void timetableStore.fetchTimetable(id)
})
</script>

<template>
  <section class="isolate flex h-full min-h-0 w-full max-w-[858px] flex-col">
    <div
      class="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <!-- Timetable -->
      <div
        class="mb-8 min-w-0 rounded-[14px] bg-[#1A1A1A] px-1 py-3 sm:px-2 sm:py-4"
      >
        <div
          v-if="timetableStore.isLoading"
          class="flex min-h-[120px] items-center justify-center px-4 text-sm text-white/50"
        >
          Loading timetable…
        </div>
        <div
          v-else-if="timetableStore.error"
          class="flex min-h-[120px] items-center justify-center px-4 text-center text-sm text-red-400/90"
        >
          {{ timetableStore.error }}
        </div>
        <div
          v-else-if="!timetableStore.isConnected"
          class="flex min-h-[120px] flex-col items-center justify-center gap-1 px-4 text-center text-sm text-white/50"
        >
          <span>EduPage is not connected.</span>
          <span class="text-xs text-white/35">Connect in settings to see your timetable.</span>
        </div>
        <div v-else class="min-w-0">
          <div
            v-if="timetableStore.isSyncing"
            class="mb-2 px-3 text-center text-[11px] text-white/45"
          >
            Syncing timetable…
          </div>
          <div
            v-if="timetableSlotGroups.length === 0"
            class="flex min-h-[100px] items-center justify-center px-4 text-sm text-white/45"
          >
            No lessons scheduled for today.
          </div>
          <div
            v-else
            class="flex min-w-0 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div
              class="grid min-h-[118px] min-w-full flex-1 gap-0"
              :style="{
                gridTemplateColumns: `repeat(${timetableSlotGroups.length}, minmax(0, 1fr))`
              }"
            >
              <div
                v-for="group in timetableSlotGroups"
                :key="`${group.start.getTime()}-${group.lessons.map((l) => l.id).join('-')}`"
                class="flex min-h-[118px] min-w-[72px] flex-col border-r border-black/40 px-1 py-1 last:border-r-0 sm:min-w-[88px] sm:px-2"
              >
                <span
                  class="shrink-0 text-center text-[11px] leading-tight text-white/45"
                >
                  {{ group.slotIndex }}
                </span>
                <div
                  class="flex min-h-0 flex-1 flex-col justify-center gap-0"
                >
                  <template v-if="group.lessons.length === 1">
                    <div
                      class="flex flex-1 flex-col items-center justify-center px-0.5"
                    >
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
            </div>
          </div>
        </div>
      </div>

      <h2
        class="mb-5 text-[20px] font-medium tracking-[-0.011em] text-white"
      >
        Recent folders
      </h2>

      <div v-if="recentFolders.length === 0" class="pb-6 text-sm text-white/45">
        No folders in this workspace yet.
      </div>
      <div v-else class="grid grid-cols-4 gap-[34px] pb-6">
        <div
          v-for="folder in recentFolders"
          :key="folder.id"
          class="relative aspect-186/146 h-[146px] w-[186px] cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
        >
          <img
            :src="bigFolder"
            :alt="folder.name"
            class="absolute inset-0 h-full w-full"
          />
          <div class="absolute inset-0 flex items-start justify-between">
            <div class="ml-[12px] mt-[31px]">
              <h3 class="text-sm font-medium text-white">{{ folder.name }}</h3>
              <p class="mt-[0.94px] text-[11px] text-white/40">
                {{ folder.noteCount }} files
              </p>
            </div>
            <button
              type="button"
              class="mt-[13px] mr-[12px] flex h-[19.55px] w-[19.55px] cursor-pointer items-center justify-center rounded-full bg-black/30 text-white/70 transition-colors hover:bg-black/70 hover:text-white"
              @click.stop
              aria-label="Folder options"
            >
              <svg
                width="10"
                height="2"
                viewBox="0 0 10 2"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="h-[2px] w-[9px] shrink-0"
                aria-hidden="true"
              >
                <path
                  d="M0.975586 0C1.51409 0 1.95215 0.437733 1.95215 0.974609C1.95202 1.51219 1.51401 1.94922 0.975586 1.94922C0.438073 1.9491 0.000128872 1.51212 0 0.974609C0 0.437805 0.437994 0.000117336 0.975586 0ZM4.62305 0C5.16062 0.00014369 5.59863 0.437821 5.59863 0.974609C5.5985 1.5121 5.16054 1.94907 4.62305 1.94922C4.08462 1.94922 3.64661 1.51219 3.64648 0.974609C3.64648 0.437733 4.08454 0 4.62305 0ZM8.27344 0C8.81182 0.000151734 9.24902 0.437826 9.24902 0.974609C9.24889 1.5121 8.81174 1.94907 8.27344 1.94922C7.73583 1.94922 7.297 1.51219 7.29688 0.974609C7.29688 0.437733 7.73575 0 8.27344 0Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div
      class="pointer-events-none sticky bottom-0 z-1 h-[2px] w-full bg-black shadow-[0_-3px_10px_-1px_rgba(0,0,0,0.35)]"
      aria-hidden="true"
    />
  </section>
</template>
