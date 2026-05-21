<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useWorkspaceStore } from '@/stores/workspace'
import { storeToRefs } from 'pinia'
import api from '@/api'
import NotificationsPopup from '@/components/dashboard/NotificationsPopup.vue'
import HeaderSearch from '@/components/dashboard/HeaderSearch.vue'
import { useWorkspaceMembers } from '@/composables/useWorkspaceMembers'
import { useWorkspaceSearch } from '@/composables/useWorkspaceSearch'
import type { WorkspaceSearchResult } from '@/types/search'

import defaultAvatar from '@/assets/img/user.svg'
import bellIcon from '@/assets/img/bell.svg'
import arrowIcon from '@/assets/img/arrow.svg'
import settingsIcon from '@/assets/img/settings.svg'
import exitIcon from '@/assets/img/exit.svg'

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
const isLoggingOut = ref(false)

const sharedUsers = [1, 2, 3]

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
    await api.post('/auth/logout')
  } catch (error) {
    console.error('Logout request failed:', error)
  } finally {
    localStorage.clear()
    userStore.user = null
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
  document.removeEventListener('pointerdown', handleNotificationsPointerDown)
  document.removeEventListener('pointerdown', handleSharePointerDown)
  document.removeEventListener('pointerdown', handleProfilePointerDown)
  document.removeEventListener('pointerdown', handleHeaderSearchPointerDown)
  clearHeaderSearchPending()
})
</script>

<template>
  <header
    class="relative z-20 grid h-16 shrink-0 grid-cols-[283px_minmax(0,1fr)_auto] items-stretch overflow-visible border-b border-panel-input-border/50 bg-panel-bg"
    :class="{
      'z-30':
        isNotificationsMenuOpen ||
        isShareMenuOpen ||
        isProfileMenuOpen ||
        isHeaderSearchDropdownVisible,
    }"
  >
    <!-- Sidebar column spacer -->
    <div class="h-full" aria-hidden="true" />

    <!-- Center: page search (separate from workspace members search in popup) -->
    <div
      class="flex h-full min-h-0 min-w-0 items-center justify-center overflow-visible pl-[5.83vw]"
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

    <!-- Right: share, avatars, bell, profile — no overlapping layers -->
    <div class="flex h-full shrink-0 items-center gap-0 pr-[94px]">
      <div ref="shareMenuRef" class="relative mr-[27px]">
        <button
          type="button"
          class="text cursor-pointer leading-none opacity-50 transition-opacity hover:opacity-100"
          :aria-expanded="isShareMenuOpen"
          aria-haspopup="dialog"
          @click="toggleShareMenu"
        >
          Share
        </button>

        <NotificationsPopup
          v-if="isShareMenuOpen"
          :workspace-name="activeWorkspaceName"
          :owner-id="activeWorkspaceOwnerId"
          :is-loading="isMembersLoading"
          :load-error="membersLoadError"
          :search-query="membersSearchQuery"
          :filtered-members="filteredMembers"
          :member-display-name="memberDisplayName"
          :member-role-label="memberRoleLabel"
          @update:search-query="membersSearchQuery = $event"
        />
      </div>

      <div class="mr-[64px] flex items-center -space-x-2.5">
        <div
          v-for="i in sharedUsers"
          :key="i"
          class="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-panel-bg bg-panel-input-bg"
          :style="{ zIndex: 10 - i }"
        >
          <img
            :src="defaultAvatar"
            class="h-full w-full bg-[#E5E5E5] object-cover"
            alt=""
          />
        </div>
      </div>

      <div ref="notificationsMenuRef" class="relative mr-[30px]">
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

      <div ref="profileMenuRef" class="relative">
        <button
          type="button"
          class="group flex cursor-pointer items-center justify-end gap-[7px]"
          :aria-expanded="isProfileMenuOpen"
          @click="toggleProfileMenu"
        >
          <div
            class="h-8 w-8 overflow-hidden rounded-full border border-panel-input-border bg-panel-input-bg"
          >
            <img
              :src="avatarUrl"
              :alt="userName"
              class="h-full w-full object-cover"
              @error="($event.target as HTMLImageElement).src = defaultAvatar"
            />
          </div>

          <span
            class="text truncate opacity-75 transition-opacity group-hover:opacity-100"
          >
            {{ userName }}
          </span>

          <img
            :src="arrowIcon"
            class="h-4 w-4 opacity-60 transition-opacity group-hover:opacity-100"
            alt=""
          />
        </button>

        <div
          v-if="isProfileMenuOpen"
          class="profile-menu"
          role="menu"
        >
          <button
            type="button"
            class="profile-menu__action profile-menu__action--settings"
            role="menuitem"
            @click="handleSettings"
          >
            <span>Settings</span>
            <img
              :src="settingsIcon"
              alt=""
              class="profile-menu__icon profile-menu__icon--settings h-5 w-5 shrink-0"
            />
          </button>
          <button
            type="button"
            class="profile-menu__action profile-menu__action--logout"
            role="menuitem"
            :disabled="isLoggingOut"
            @click="handleLogout"
          >
            <span>{{ isLoggingOut ? 'Logging out...' : 'Log out' }}</span>
            <img :src="exitIcon" alt="" class="h-5 w-5 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.text {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 150%;
  letter-spacing: -0.011em;
  color: var(--color-brand-white);
}

.profile-menu {
  position: absolute;
  right: 0;
  top: 100%;
  z-index: 50;
  margin-top: 1.25rem;
  display: flex;
  align-items: center;
  gap: 49px;
  padding: 15px 26px;
  border: 1px solid #212121;
  border-radius: 10px;
  background: #000000;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.25);
}

.profile-menu__action {
  display: flex;
  align-items: center;
  gap: 19px;
  border: none;
  background: transparent;
  padding: 0;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 150%;
  letter-spacing: -0.132px;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s ease;
}

.profile-menu__action:hover:not(:disabled) {
  opacity: 0.85;
}

.profile-menu__action:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.profile-menu__action--settings {
  color: #ffffff;
}

.profile-menu__icon--settings {
  filter: brightness(0) invert(1);
}

.profile-menu__action--logout {
  color: #ad2222;
}

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
