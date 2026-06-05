<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, inject } from 'vue'
import { dashboardLayoutMetricsKey } from '@/composables/useDashboardContentAlign'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useWorkspaceStore } from '@/stores/workspace'
import { storeToRefs } from 'pinia'
import HeaderSearch from '@/components/dashboard/HeaderSearch.vue'
import HeaderSharePlaceholder from '@/components/dashboard/HeaderSharePlaceholder.vue'
import HeaderProfileMenu from '@/components/dashboard/HeaderProfileMenu.vue'
import { useWorkspaceMembers } from '@/composables/useWorkspaceMembers'
import { useWorkspaceSearch } from '@/composables/useWorkspaceSearch'
import type { WorkspaceSearchResult } from '@/types/search'

import defaultAvatar from '@/assets/img/user.svg'
import logoIcon from '@/assets/img/logo.svg'
import bellIcon from '@/assets/img/bell.svg'
const props = defineProps<{
  hasNotifications: boolean
  notifications: Array<{ id: string; title: string; read: boolean }>
  isNotificationsLoading: boolean
}>()

const emit = defineEmits<{
  'refresh-notifications': []
}>()

const userStore = useUserStore()
const workspaceStore = useWorkspaceStore()
const { user } = storeToRefs(userStore)
const router = useRouter()

const {
  isLoading: isMembersLoading,
  loadError: membersLoadError,
  searchQuery: membersSearchQuery,
  filteredMembers,
  memberDisplayName,
  memberRoleLabel,
  resetSearch: resetMembersSearch,
  invalidateCache: invalidateMembersCache,
  fetchMembers,
} = useWorkspaceMembers()

const userName = computed(() => {
  if (!user.value) return 'Loading...'
  return `${user.value.name} ${user.value.surname}`
})

const avatarUrl = computed(() => user.value?.avatar || defaultAvatar)

const headerSearchQuery = ref('')
const isHeaderSearchFocused = ref(false)
const isProfileMenuOpen = ref(false)
const isNotificationsMenuOpen = ref(false)
const isShareMenuOpen = ref(false)
const notificationsMenuRef = ref<HTMLElement | null>(null)
const shareMenuRef = ref<HTMLElement | null>(null)
const profileMenuRef = ref<HTMLElement | null>(null)
const headerSearchRef = ref<HTMLElement | null>(null)
const headerSidebarRef = ref<HTMLElement | null>(null)
const headerSidebarRight = ref(0)
const isLoggingOut = ref(false)

const layoutMetrics = inject(dashboardLayoutMetricsKey, null)

let headerSidebarObserver: ResizeObserver | null = null

function measureHeaderSidebar() {
  headerSidebarRight.value =
    headerSidebarRef.value?.getBoundingClientRect().right ?? 0
}

const searchAreaStyle = computed(() => {
  const contentLeft = layoutMetrics?.contentAlignLeft.value ?? 0
  if (!contentLeft) return undefined

  const inset = Math.max(0, Math.round(contentLeft - headerSidebarRight.value))
  return { paddingLeft: `${inset}px` }
})

onMounted(() => {
  measureHeaderSidebar()
  if (!headerSidebarRef.value) return

  headerSidebarObserver = new ResizeObserver(measureHeaderSidebar)
  headerSidebarObserver.observe(headerSidebarRef.value)
  window.addEventListener('resize', measureHeaderSidebar, { passive: true })
})

watch(
  () => layoutMetrics?.contentAlignLeft.value,
  () => measureHeaderSidebar(),
)

const activeWorkspaceId = computed(
  () => workspaceStore.activeWorkspace?.id ?? null,
)

const {
  results: searchResults,
  isLoading: isSearchLoading,
  error: searchError,
  searchDebounced,
  reset: resetHeaderSearch,
  clearPending: clearHeaderSearchPending,
} = useWorkspaceSearch(activeWorkspaceId)

const isHeaderSearchDropdownVisible = computed(
  () =>
    isHeaderSearchFocused.value && headerSearchQuery.value.trim().length > 0,
)
const activeWorkspaceName = computed(
  () => workspaceStore.activeWorkspace?.name ?? '',
)
const activeWorkspaceOwnerId = computed(
  () => workspaceStore.activeWorkspace?.ownerId ?? '',
)

async function handleLogout() {
  if (isLoggingOut.value) return

  isLoggingOut.value = true
  try {
    await userStore.logout()
  } finally {
    closeProfileMenu()
    isLoggingOut.value = false
    router.push({ name: 'Login' })
  }
}

function closeProfileMenu() {
  isProfileMenuOpen.value = false
}

function handleSettings() {
  closeProfileMenu()
  router.push({ name: 'DashboardSettings' })
}

function closeNotificationsMenu() {
  isNotificationsMenuOpen.value = false
}

async function openShareMenu() {
  closeProfileMenu()
  closeNotificationsMenu()
  isShareMenuOpen.value = true

  const workspaceId = activeWorkspaceId.value
  if (!workspaceId) {
    membersLoadError.value = 'No workspace selected.'
    return
  }

  await fetchMembers(workspaceId)
}

function closeShareMenu() {
  isShareMenuOpen.value = false
  resetMembersSearch()
}

function closeHeaderSearch() {
  isHeaderSearchFocused.value = false
  clearHeaderSearchPending()
}

function handleHeaderSearchFocus() {
  closeProfileMenu()
  closeNotificationsMenu()
  closeShareMenu()
  isHeaderSearchFocused.value = true
  if (headerSearchQuery.value.trim()) {
    searchDebounced(headerSearchQuery.value)
  }
}

function handleHeaderSearchInput() {
  searchDebounced(headerSearchQuery.value)
}

function handleSelectSearchResult(item: WorkspaceSearchResult) {
  headerSearchQuery.value = ''
  resetHeaderSearch()
  closeHeaderSearch()

  if (item.type === 'folder') {
    router.push({
      name: 'DashboardFolderNotes',
      params: { folderId: item.id },
    })
    return
  }

  if (item.folderId) {
    router.push({
      name: 'DashboardFolderNotes',
      params: { folderId: item.folderId, noteId: item.id },
    })
  }
}

function handleHeaderSearchPointerDown(event: PointerEvent) {
  if (!isHeaderSearchFocused.value) return
  const root = headerSearchRef.value
  if (root?.contains(event.target as Node)) return
  closeHeaderSearch()
}

watch(headerSearchQuery, (query) => {
  if (!query.trim()) {
    resetHeaderSearch()
  }
})

watch(isHeaderSearchFocused, (isFocused) => {
  if (isFocused) {
    requestAnimationFrame(() => {
      document.addEventListener('pointerdown', handleHeaderSearchPointerDown)
    })
    return
  }
  document.removeEventListener('pointerdown', handleHeaderSearchPointerDown)
})

function handleRefreshNotifications() {
  emit('refresh-notifications')
}

watch(activeWorkspaceId, (workspaceId, previousId) => {
  if (workspaceId !== previousId) {
    invalidateMembersCache()
  }
})

function toggleNotificationsMenu() {
  isNotificationsMenuOpen.value = !isNotificationsMenuOpen.value
  if (isNotificationsMenuOpen.value) {
    closeProfileMenu()
    closeShareMenu()
  }
}

function toggleShareMenu() {
  if (isShareMenuOpen.value) {
    closeShareMenu()
    return
  }
  void openShareMenu()
}

function toggleProfileMenu() {
  isProfileMenuOpen.value = !isProfileMenuOpen.value
  if (isProfileMenuOpen.value) {
    closeNotificationsMenu()
    closeShareMenu()
  }
}

function handleNotificationsPointerDown(event: PointerEvent) {
  if (!isNotificationsMenuOpen.value) return
  const root = notificationsMenuRef.value
  if (root?.contains(event.target as Node)) return
  closeNotificationsMenu()
}

function handleSharePointerDown(event: PointerEvent) {
  if (!isShareMenuOpen.value) return
  const root = shareMenuRef.value
  if (root?.contains(event.target as Node)) return
  closeShareMenu()
}

function handleProfilePointerDown(event: PointerEvent) {
  if (!isProfileMenuOpen.value) return
  const root = profileMenuRef.value
  if (root?.contains(event.target as Node)) return
  closeProfileMenu()
}

watch(isNotificationsMenuOpen, (isOpen) => {
  if (isOpen) {
    requestAnimationFrame(() => {
      document.addEventListener('pointerdown', handleNotificationsPointerDown)
    })
    return
  }
  document.removeEventListener('pointerdown', handleNotificationsPointerDown)
})

watch(isShareMenuOpen, (isOpen) => {
  if (isOpen) {
    requestAnimationFrame(() => {
      document.addEventListener('pointerdown', handleSharePointerDown)
    })
    return
  }
  document.removeEventListener('pointerdown', handleSharePointerDown)
})

watch(isProfileMenuOpen, (isOpen) => {
  if (isOpen) {
    requestAnimationFrame(() => {
      document.addEventListener('pointerdown', handleProfilePointerDown)
    })
    return
  }
  document.removeEventListener('pointerdown', handleProfilePointerDown)
})

onUnmounted(() => {
  headerSidebarObserver?.disconnect()
  window.removeEventListener('resize', measureHeaderSidebar)
  document.removeEventListener('pointerdown', handleNotificationsPointerDown)
  document.removeEventListener('pointerdown', handleSharePointerDown)
  document.removeEventListener('pointerdown', handleProfilePointerDown)
  document.removeEventListener('pointerdown', handleHeaderSearchPointerDown)
  clearHeaderSearchPending()
})
</script>

<template>
  <header
    class="relative z-20 flex h-16 shrink-0 items-stretch overflow-visible border-b border-panel-input-border/50 bg-panel-bg"
    :class="{
      'z-30':
        isNotificationsMenuOpen ||
        isShareMenuOpen ||
        isProfileMenuOpen ||
        isHeaderSearchDropdownVisible,
    }"
  >
    <!-- Sidebar column: width from --dashboard-sidebar-width -->
    <div
      ref="headerSidebarRef"
      class="dashboard-sidebar flex h-full items-center justify-center"
    >
      <router-link
        :to="{ name: 'DashboardHome' }"
        class="block shrink-0 leading-none"
        aria-label="Home"
      >
        <img :src="logoIcon" alt="" class="block h-auto w-auto max-h-full" />
      </router-link>
    </div>

    <!-- Center: padding tracks live content column position from DashboardLayout -->
    <div
      class="flex min-w-0 flex-1 items-center overflow-visible"
      :style="searchAreaStyle"
    >
      <div
        ref="headerSearchRef"
        class="relative h-[37px] w-full max-w-[335px] shrink-0 overflow-visible"
      >
        <HeaderSearch
          v-model="headerSearchQuery"
          :expanded="isHeaderSearchDropdownVisible"
          :results="searchResults"
          :is-loading="isSearchLoading"
          :error="searchError"
          @focus="handleHeaderSearchFocus"
          @input="handleHeaderSearchInput"
          @select="handleSelectSearchResult"
        />
      </div>
    </div>

    <!-- Right: spacing per Figma — Share↔avatars 27px, avatars↔bell 27px, bell↔profile 70px, pic↔name 15px, name↔arrow 12px -->
    <div class="flex h-full shrink-0 items-center pr-[94px]">
      <div ref="shareMenuRef">
        <HeaderSharePlaceholder
          :is-open="isShareMenuOpen"
          :workspace-name="activeWorkspaceName"
          :owner-id="activeWorkspaceOwnerId"
          :is-loading="isMembersLoading"
          :load-error="membersLoadError ?? ''"
          :search-query="membersSearchQuery"
          :filtered-members="filteredMembers"
          :member-display-name="memberDisplayName"
          :member-role-label="memberRoleLabel"
          @toggle="toggleShareMenu"
          @update:search-query="membersSearchQuery = $event"
        />
      </div>

      <div ref="notificationsMenuRef" class="relative ml-[1.6875rem]">
        <button
          type="button"
          class="relative flex cursor-pointer items-center text-panel-label transition-colors hover:text-panel-text"
          :aria-expanded="isNotificationsMenuOpen"
          aria-haspopup="dialog"
          @click="toggleNotificationsMenu"
        >
          <img
            :src="bellIcon"
            alt="Notifications"
            class="h-5 w-5 object-contain"
          />
          <span
            v-if="props.hasNotifications"
            class="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-error"
          />
        </button>

        <div
          v-if="isNotificationsMenuOpen"
          class="notifications-dropdown"
          role="dialog"
          aria-label="Notifications"
        >
          <div class="notifications-dropdown__header">
            <p class="notifications-dropdown__title">Notifications</p>
            <button
              type="button"
              class="notifications-dropdown__refresh"
              :disabled="props.isNotificationsLoading"
              aria-label="Refresh notifications"
              @click="handleRefreshNotifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15.55-6.36L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15.55 6.36L3 16" />
              </svg>
            </button>
          </div>

          <div
            v-if="props.isNotificationsLoading"
            class="notifications-dropdown__status"
          >
            Loading notifications...
          </div>
          <div
            v-else-if="props.notifications.length === 0"
            class="notifications-dropdown__status"
          >
            No notifications
          </div>
          <ul v-else class="notifications-dropdown__list">
            <li
              v-for="notification in props.notifications"
              :key="notification.id"
              class="notifications-dropdown__item"
            >
              {{ notification.title }}
            </li>
          </ul>
        </div>
      </div>

      <div ref="profileMenuRef">
        <HeaderProfileMenu
          :is-open="isProfileMenuOpen"
          :user-name="userName"
          :avatar-url="avatarUrl"
          :is-logging-out="isLoggingOut"
          @toggle="toggleProfileMenu"
          @settings="handleSettings"
          @logout="handleLogout"
        />
      </div>
    </div>
  </header>
</template>

<style scoped>
.notifications-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  z-index: 50;
  margin-top: 1.25rem;
  width: 320px;
  max-width: calc(100vw - 2rem);
  border-radius: 0.375rem;
  border: 1px solid var(--panel-input-border);
  background: var(--panel-bg);
  padding: 0.75rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.25);
}

.notifications-dropdown__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.notifications-dropdown__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--panel-text);
}

.notifications-dropdown__refresh {
  border: none;
  border-radius: 0.25rem;
  background: transparent;
  padding: 0.25rem;
  color: var(--panel-label);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.notifications-dropdown__refresh:hover:not(:disabled) {
  background: var(--panel-input-bg);
  color: var(--panel-text);
}

.notifications-dropdown__refresh:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.notifications-dropdown__status {
  padding: 1.5rem 0;
  text-align: center;
  font-size: 0.875rem;
  color: var(--panel-label);
}

.notifications-dropdown__list {
  max-height: 18rem;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.notifications-dropdown__list::-webkit-scrollbar {
  display: none;
}

.notifications-dropdown__item {
  border-radius: 0.25rem;
  padding: 0.5rem;
  font-size: 0.875rem;
  color: var(--panel-text);
  transition: background-color 0.15s ease;
}

.notifications-dropdown__item:hover {
  background: var(--panel-input-bg);
}
</style>
