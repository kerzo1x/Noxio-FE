<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import HomeTimetableSlot from '@/components/dashboard/home/HomeTimetableSlot.vue'
import { useTimetableStore } from '@/stores/timetable'
import { useWorkspaceStore } from '@/stores/workspace'
import { buildSlotGroups, lessonsForLocalToday } from '@/utils/edupageTimetable'

const router = useRouter()
const workspaceStore = useWorkspaceStore()
const timetableStore = useTimetableStore()

const timetableSlotGroups = computed(() =>
  buildSlotGroups(lessonsForLocalToday(timetableStore.lessons)),
)

async function handleTimetableSync() {
  const workspaceId = workspaceStore.activeWorkspace?.id
  if (!workspaceId || timetableStore.isSyncRequesting) return
  try {
    await timetableStore.syncTimetable(workspaceId)
  } catch {
    /* error shown via timetableStore.error */
  }
}

watch(
  () => workspaceStore.activeWorkspace?.id ?? null,
  (workspaceId) => {
    if (!workspaceId) {
      timetableStore.reset()
      return
    }
    void timetableStore.fetchTimetable(workspaceId)
  },
)

onMounted(() => {
  const id = workspaceStore.activeWorkspace?.id
  if (id) void timetableStore.fetchTimetable(id)
})
</script>

<template>
  <div class="mb-8 min-w-0 rounded-[14px] bg-[#1A1A1A] px-1 py-3 sm:px-2 sm:py-4">
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
      <button
        type="button"
        class="mt-1 cursor-pointer border-0 bg-transparent text-sm text-white/40 transition-colors hover:text-white/60"
        @click="router.push({ name: 'SettingsEdupage' })"
      >
        connect
      </button>
    </div>
    <div
      v-else-if="timetableStore.isConnected && !timetableStore.syncedAt && timetableStore.isSyncing"
      class="flex min-h-[120px] flex-col items-center justify-center gap-1 px-4 text-center text-sm text-white/50"
    >
      <span>Syncing timetable…</span>
    </div>
    <div
      v-else-if="timetableStore.isNotSynced"
      class="flex min-h-[120px] flex-col items-center justify-center gap-1 px-4 text-center text-sm text-white/50"
    >
      <span>EduPage is not synced.</span>
      <button
        type="button"
        class="mt-1 cursor-pointer border-0 bg-transparent text-sm text-white/40 transition-colors hover:text-white/60 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="timetableStore.isSyncRequesting"
        @click="handleTimetableSync"
      >
        {{ timetableStore.isSyncRequesting ? 'syncing…' : 'sync' }}
      </button>
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
            gridTemplateColumns: `repeat(${timetableSlotGroups.length}, minmax(0, 1fr))`,
          }"
        >
          <HomeTimetableSlot
            v-for="group in timetableSlotGroups"
            :key="`${group.start.getTime()}-${group.lessons.map((l) => l.id).join('-')}`"
            :group="group"
          />
        </div>
      </div>
    </div>
  </div>
</template>
