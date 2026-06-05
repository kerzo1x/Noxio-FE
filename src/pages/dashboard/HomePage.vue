<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { EdupageTimetableLesson } from '@/types/edupage'
import {
  formatEdupageHm,
  isEdupageLessonOnLocalToday,
  parseEdupageDateTime,
} from '@/utils/edupageTime'
import { subjectAbbrev } from '@/utils/subjectAbbrev'
import { listTaskCategories } from '@/api/taskCategories'
import { listTodoListTasks } from '@/api/todoLists'
import { useFoldersStore, type Folder } from '@/stores/folders'
import { useTodoListsStore, type TodoTask } from '@/stores/todoLists'
import { useWorkspaceStore } from '@/stores/workspace'
import { useTimetableStore } from '@/stores/timetable'
import EditFolderPopup from '@/components/dashboard/EditFolderPopup.vue'
import DeleteFolderPopup from '@/components/dashboard/DeleteFolderPopup.vue'
import FolderCardContextMenu from '@/components/dashboard/FolderCardContextMenu.vue'
import bigFolder from '@/assets/img/big-folder.svg'

const router = useRouter()
const workspaceStore = useWorkspaceStore()
const foldersStore = useFoldersStore()
const todoListsStore = useTodoListsStore()
const timetableStore = useTimetableStore()

interface UpcomingDeadlineRow {
  taskId: string
  todoListId: string
  name: string
  category: string
  todoList: string
  deadlineAt: string
}

const upcomingRows = ref<UpcomingDeadlineRow[]>([])
const upcomingLoading = ref(false)
const upcomingError = ref<string | null>(null)

const UPCOMING_DEADLINES_LIMIT = 50

const menuOpenFolderId = ref<string | null>(null)
const folderToEdit = ref<Folder | null>(null)
const folderToDelete = ref<Folder | null>(null)
const showEditPopup = ref(false)
const showDeletePopup = ref(false)

interface TimetableSlotGroup {
  slotIndex: number
  start: Date
  end: Date
  lessons: EdupageTimetableLesson[]
}

function lessonsForLocalToday(
  list: EdupageTimetableLesson[],
  now: Date = new Date()
): EdupageTimetableLesson[] {
  return list.filter((l) =>
    isEdupageLessonOnLocalToday(parseEdupageDateTime(l.startTime), now)
  )
}

function buildSlotGroups(dayLessons: EdupageTimetableLesson[]): TimetableSlotGroup[] {
  const sorted = [...dayLessons].sort(
    (a, b) =>
      parseEdupageDateTime(a.startTime).getTime() -
      parseEdupageDateTime(b.startTime).getTime()
  )
  const clusters: EdupageTimetableLesson[][] = []
  for (const lesson of sorted) {
    const t = parseEdupageDateTime(lesson.startTime).getTime()
    const prev = clusters[clusters.length - 1]
    if (prev && parseEdupageDateTime(prev[0].startTime).getTime() === t) {
      prev.push(lesson)
    } else {
      clusters.push([lesson])
    }
  }
  return clusters.map((group, i) => {
    const start = parseEdupageDateTime(group[0].startTime)
    const endMs = Math.max(
      ...group.map((l) => parseEdupageDateTime(l.endTime).getTime())
    )
    return { slotIndex: i + 1, start, end: new Date(endMs), lessons: group }
  })
}

const timetableSlotGroups = computed(() =>
  buildSlotGroups(lessonsForLocalToday(timetableStore.lessons))
)

const recentFolders = computed(() => {
  const workspaceId = workspaceStore.activeWorkspace?.id
  if (!workspaceId) return []

  return [...foldersStore.folders]
    .filter((f) => f.workspaceId === workspaceId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4)
})

function formatSlotRange(start: Date, end: Date): string {
  return `${formatEdupageHm(start)}–${formatEdupageHm(end)}`
}

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
    if (!workspaceId) { timetableStore.reset(); return }
    void timetableStore.fetchTimetable(workspaceId)
  }
)

onMounted(() => {
  const id = workspaceStore.activeWorkspace?.id
  if (id) void timetableStore.fetchTimetable(id)
})

function openFolderNotes(folderId: string) {
  router.push({
    name: 'DashboardFolderNotes',
    params: { folderId },
  })
}

function isMenuOpen(folderId: string) {
  return menuOpenFolderId.value === folderId
}

function setMenuOpen(folderId: string, open: boolean) {
  menuOpenFolderId.value = open ? folderId : null
}

function handleEdit(folder: Folder) {
  folderToEdit.value = folder
  showEditPopup.value = true
}

function handleDelete(folder: Folder) {
  folderToDelete.value = folder
  showDeletePopup.value = true
}

function formatDeadlineDate(deadlineAt: string): string {
  const date = new Date(deadlineAt)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
}

function resolveCategoryName(
  categoryId: string | null,
  categoryById: Map<string, string>,
): string {
  if (!categoryId) return '—'
  return categoryById.get(categoryId) ?? categoryId
}

function isUpcomingTask(task: TodoTask, startOfToday: Date): boolean {
  if (!task.deadlineAt || task.status === 'DONE') return false
  const deadline = new Date(task.deadlineAt)
  return !Number.isNaN(deadline.getTime()) && deadline >= startOfToday
}

async function fetchUpcomingDeadlines(workspaceId: string) {
  upcomingLoading.value = true
  upcomingError.value = null

  try {
    const lists = todoListsStore.todoLists.filter((list) => list.workspaceId === workspaceId)

    if (lists.length === 0) {
      upcomingRows.value = []
      return
    }

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const [categoriesResponse, ...taskResponses] = await Promise.all([
      listTaskCategories(workspaceId),
      ...lists.map((list) =>
        listTodoListTasks(list.id, {
          page: 1,
          limit: 100,
          sortBy: 'deadlineAt',
          sortOrder: 'asc',
          deadlineFilter: 'month',
        }),
      ),
    ])

    const categoriesPayload = categoriesResponse.data
    const categoryById = new Map<string, string>()
    if (categoriesPayload?.success) {
      for (const category of categoriesPayload.data) {
        categoryById.set(category.id, category.name)
      }
    }

    const listById = new Map(lists.map((list) => [list.id, list.name]))
    const merged: UpcomingDeadlineRow[] = []

    for (let index = 0; index < lists.length; index += 1) {
      const list = lists[index]
      const payload = taskResponses[index]?.data
      if (!payload?.success) continue

      for (const task of payload.data) {
        if (!isUpcomingTask(task, startOfToday)) continue

        merged.push({
          taskId: task.id,
          todoListId: task.todoListId,
          name: task.title,
          category: resolveCategoryName(task.categoryId, categoryById),
          todoList: listById.get(list.id) ?? '—',
          deadlineAt: task.deadlineAt!,
        })
      }
    }

    merged.sort(
      (a, b) => new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime(),
    )
    upcomingRows.value = merged.slice(0, UPCOMING_DEADLINES_LIMIT)
  } catch (error) {
    upcomingError.value =
      error instanceof Error ? error.message : 'Failed to load upcoming deadlines'
    upcomingRows.value = []
  } finally {
    upcomingLoading.value = false
  }
}

function openTodoList(todoListId: string) {
  router.push({
    name: 'DashboardTodoList',
    params: { todoListId },
  })
}

watch(
  () =>
    [
      workspaceStore.activeWorkspace?.id ?? null,
      todoListsStore.loadedWorkspaceId,
      todoListsStore.todoLists.length,
    ] as const,
  ([workspaceId]) => {
    if (!workspaceId) {
      upcomingRows.value = []
      upcomingError.value = null
      return
    }
    if (todoListsStore.loadedWorkspaceId !== workspaceId) return
    void fetchUpcomingDeadlines(workspaceId)
  },
  { immediate: true },
)
</script>

<template>
  <section class="dashboard-page-column">
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
          <button
            type="button"
            class="mt-1 cursor-pointer border-0 bg-transparent text-sm text-white/40 transition-colors hover:text-white/60"
            @click="router.push({ name: 'EdupageLogin' })"
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
      <div v-else class="grid grid-cols-4 gap-[34px] pb-10">
        <div
          v-for="folder in recentFolders"
          :key="folder.id"
          role="button"
          tabindex="0"
          class="folder-card"
          @click="openFolderNotes(folder.id)"
          @keydown.enter="openFolderNotes(folder.id)"
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
            <FolderCardContextMenu
              :model-value="isMenuOpen(folder.id)"
              @update:model-value="setMenuOpen(folder.id, $event)"
              @edit="handleEdit(folder)"
              @delete="handleDelete(folder)"
            />
          </div>
        </div>
      </div>

      <h2
        class="mb-5 text-[20px] font-medium tracking-[-0.011em] text-white"
      >
        Upcoming deadlines
      </h2>

      <div
        class="mb-6 overflow-hidden rounded-[10px] border border-[#161616] bg-[#101010]"
      >
        <div
          class="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.85fr)] gap-4 px-4 py-3.5 text-[10px] font-bold leading-normal text-[#a2a2a2]"
        >
          <span>Name</span>
          <span>Category</span>
          <span>Todo List</span>
          <span class="text-right">Deadline</span>
        </div>

        <div
          class="min-h-[120px] rounded-[10px] border border-[#212121] bg-[#161616]"
        >
          <div
            v-if="upcomingLoading"
            class="flex min-h-[120px] items-center justify-center px-4 text-sm text-white/50"
          >
            Loading deadlines…
          </div>
          <div
            v-else-if="upcomingError"
            class="flex min-h-[120px] items-center justify-center px-4 text-center text-sm text-red-400/90"
          >
            {{ upcomingError }}
          </div>
          <div
            v-else-if="upcomingRows.length === 0"
            class="flex min-h-[120px] items-center justify-center px-4 text-sm text-white/45"
          >
            No upcoming deadlines this month.
          </div>
          <div v-else class="flex flex-col gap-1 py-2">
            <div
              v-for="row in upcomingRows"
              :key="row.taskId"
              role="button"
              tabindex="0"
              class="grid cursor-pointer grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.85fr)] gap-4 rounded-[6px] px-4 py-3 text-sm leading-normal text-white transition-colors hover:bg-white/5"
              @click="openTodoList(row.todoListId)"
              @keydown.enter="openTodoList(row.todoListId)"
            >
              <span class="truncate">{{ row.name }}</span>
              <span class="truncate text-white/90">{{ row.category }}</span>
              <span class="truncate text-white/90">{{ row.todoList }}</span>
              <span class="truncate text-right text-white/90">
                {{ formatDeadlineDate(row.deadlineAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      class="pointer-events-none sticky bottom-0 z-1 h-[2px] w-full bg-black shadow-[0_-3px_10px_-1px_rgba(0,0,0,0.35)]"
      aria-hidden="true"
    />

    <EditFolderPopup v-model="showEditPopup" :folder="folderToEdit" />
    <DeleteFolderPopup v-model="showDeletePopup" :folder="folderToDelete" />
  </section>
</template>
