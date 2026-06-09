<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useHeaderMenus } from '@/composables/useHeaderMenus'
import { useHeaderSidebarAlign } from '@/composables/useHeaderSidebarAlign'
import { useUserStore } from '@/stores/user'
import { useWorkspaceStore } from '@/stores/workspace'
import { useWorkspaceMembers } from '@/composables/useWorkspaceMembers'
import { useWorkspaceSearch } from '@/composables/useWorkspaceSearch'
import { navigateToSearchResult } from '@/utils/searchNavigation'
import type { WorkspaceSearchResult } from '@/types/search'
import HeaderLogo from '@/components/dashboard/header/HeaderLogo.vue'
import HeaderSearch from '@/components/dashboard/HeaderSearch.vue'
import HeaderShareMenu from '@/components/dashboard/header/HeaderShareMenu.vue'
import HeaderNotificationsMenu from '@/components/dashboard/header/HeaderNotificationsMenu.vue'
import HeaderProfileMenu from '@/components/dashboard/HeaderProfileMenu.vue'
import defaultAvatar from '@/assets/img/user.svg'

const props = defineProps<{
  hasNotifications: boolean
  notifications: Array<{ id: string; title: string; read: boolean }>
  isNotificationsLoading: boolean
}>()

const emit = defineEmits<{ 'refresh-notifications': [] }>()

const userStore = useUserStore()
const workspaceStore = useWorkspaceStore()
const { user } = storeToRefs(userStore)
const router = useRouter()

const headerMenus = useHeaderMenus()
const {
  isProfileMenuOpen,
  isNotificationsMenuOpen,
  isShareMenuOpen,
  isSearchFocused,
  closeProfileMenu,
  closeShareMenu,
  closeSearch,
  toggleProfileMenu,
  toggleNotificationsMenu,
  openShareMenu,
  focusSearch,
} = headerMenus

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
const headerSearchQuery = ref('')
const headerSidebarRef = ref<HTMLElement | null>(null)
const isLoggingOut = ref(false)
const { searchAreaStyle } = useHeaderSidebarAlign(headerSidebarRef)

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
  () => isSearchFocused.value && headerSearchQuery.value.trim().length > 0,
)

const userName = computed(() =>
  user.value ? `${user.value.name} ${user.value.surname}` : 'Loading...',
)
const avatarUrl = computed(
  () => user.value?.avatar?.fileUrl || defaultAvatar,
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

async function handleShareMenuToggle() {
  if (isShareMenuOpen.value) {
    closeShareMenu()
    resetMembersSearch()
    return
  }
  openShareMenu()
  const workspaceId = activeWorkspaceId.value
  if (!workspaceId) {
    membersLoadError.value = 'No workspace selected.'
    return
  }
  await fetchMembers(workspaceId)
}

watch(isShareMenuOpen, (open) => {
  if (!open) resetMembersSearch()
})

function closeHeaderSearch() {
  closeSearch()
  clearHeaderSearchPending()
}

function handleHeaderSearchFocus() {
  focusSearch()
  if (headerSearchQuery.value.trim()) {
    searchDebounced(headerSearchQuery.value)
  }
}

function handleSelectSearchResult(item: WorkspaceSearchResult) {
  headerSearchQuery.value = ''
  resetHeaderSearch()
  closeHeaderSearch()
  navigateToSearchResult(router, item)
}

watch(headerSearchQuery, (query) => {
  if (!query.trim()) resetHeaderSearch()
})

watch(activeWorkspaceId, (workspaceId, previousId) => {
  if (workspaceId !== previousId) invalidateMembersCache()
})

onUnmounted(() => clearHeaderSearchPending())
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
    <div
      ref="headerSidebarRef"
      class="dashboard-sidebar flex h-full items-center justify-center"
    >
      <HeaderLogo />
    </div>

    <div
      class="flex min-w-0 flex-1 items-center overflow-visible"
      :style="searchAreaStyle"
    >
      <div
        :ref="(el) => { headerMenus.searchRef.value = el as HTMLElement | null }"
        class="relative h-[37px] w-full max-w-[335px] shrink-0 overflow-visible"
      >
        <HeaderSearch
          v-model="headerSearchQuery"
          :expanded="isHeaderSearchDropdownVisible"
          :results="searchResults"
          :is-loading="isSearchLoading"
          :error="searchError"
          @focus="handleHeaderSearchFocus"
          @input="searchDebounced(headerSearchQuery)"
          @select="handleSelectSearchResult"
        />
      </div>
    </div>

    <div class="flex h-full shrink-0 items-center pr-[94px]">
      <div :ref="(el) => { headerMenus.shareMenuRef.value = el as HTMLElement | null }">
        <HeaderShareMenu
          :is-open="isShareMenuOpen"
          :workspace-name="activeWorkspaceName"
          :owner-id="activeWorkspaceOwnerId"
          :is-loading="isMembersLoading"
          :load-error="membersLoadError ?? ''"
          :search-query="membersSearchQuery"
          :filtered-members="filteredMembers"
          :member-display-name="memberDisplayName"
          :member-role-label="memberRoleLabel"
          @toggle="handleShareMenuToggle"
          @update:search-query="membersSearchQuery = $event"
        />
      </div>

      <div :ref="(el) => { headerMenus.notificationsMenuRef.value = el as HTMLElement | null }">
        <HeaderNotificationsMenu
          :is-open="isNotificationsMenuOpen"
          :has-notifications="props.hasNotifications"
          :notifications="props.notifications"
          :is-loading="props.isNotificationsLoading"
          @toggle="toggleNotificationsMenu"
          @refresh="emit('refresh-notifications')"
        />
      </div>

      <div :ref="(el) => { headerMenus.profileMenuRef.value = el as HTMLElement | null }">
        <HeaderProfileMenu
          :is-open="isProfileMenuOpen"
          :user-name="userName"
          :avatar-url="avatarUrl"
          :is-logging-out="isLoggingOut"
          @toggle="toggleProfileMenu"
          @settings="() => { closeProfileMenu(); router.push({ name: 'SettingsProfile' }) }"
          @logout="handleLogout"
        />
      </div>
    </div>
  </header>
</template>
