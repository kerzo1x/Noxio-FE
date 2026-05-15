<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useWorkspaceStore } from '@/stores/workspace'
import { storeToRefs } from 'pinia'
import api from '@/api'
import NotificationsPopup from '@/components/dashboard/NotificationsPopup.vue'
import { useWorkspaceMembers } from '@/composables/useWorkspaceMembers'

import defaultAvatar from '@/assets/img/user.svg'
import bellIcon from '@/assets/img/bell.svg'
import arrowIcon from '@/assets/img/arrow.svg'

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
  reset: resetMembers,
  fetchMembers,
} = useWorkspaceMembers()

const userName = computed(() => {
  if (!user.value) return 'Loading...'
  return `${user.value.name} ${user.value.surname}`
})

const avatarUrl = computed(() => user.value?.avatar || defaultAvatar)

const headerSearchQuery = ref('')
const isProfileMenuOpen = ref(false)
const isNotificationsMenuOpen = ref(false)
const notificationsMenuRef = ref<HTMLElement | null>(null)
const isLoggingOut = ref(false)

const sharedUsers = [1, 2, 3]

const activeWorkspaceId = computed(
  () => workspaceStore.activeWorkspace?.id ?? null,
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
    isProfileMenuOpen.value = false
    isLoggingOut.value = false
    router.push({ name: 'Login' })
  }
}

async function openNotificationsMenu() {
  isProfileMenuOpen.value = false
  isNotificationsMenuOpen.value = true

  const workspaceId = activeWorkspaceId.value
  if (!workspaceId) {
    resetMembers()
    membersLoadError.value = 'No workspace selected.'
    return
  }

  await fetchMembers(workspaceId)
}

function closeNotificationsMenu() {
  isNotificationsMenuOpen.value = false
  resetMembers()
}

function toggleNotificationsMenu() {
  if (isNotificationsMenuOpen.value) {
    closeNotificationsMenu()
    return
  }
  void openNotificationsMenu()
}

function toggleProfileMenu() {
  isProfileMenuOpen.value = !isProfileMenuOpen.value
  if (isProfileMenuOpen.value) {
    closeNotificationsMenu()
  }
}

function handleNotificationsPointerDown(event: PointerEvent) {
  if (!isNotificationsMenuOpen.value) return
  const root = notificationsMenuRef.value
  if (root?.contains(event.target as Node)) return
  closeNotificationsMenu()
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

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleNotificationsPointerDown)
})
</script>

<template>
  <header
    class="relative z-20 grid h-16 shrink-0 grid-cols-[283px_minmax(0,1fr)_auto] items-center border-b border-panel-input-border/50 bg-panel-bg"
    :class="{ 'z-30': isNotificationsMenuOpen || isProfileMenuOpen }"
  >
    <!-- Sidebar column spacer -->
    <div aria-hidden="true" />

    <!-- Center: page search (separate from workspace members search in popup) -->
    <div class="flex min-w-0 justify-start pl-[5.83vw]">
      <div class="relative w-full max-w-[335px]">
        <svg
          class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-panel-placeholder"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          v-model="headerSearchQuery"
          type="text"
          placeholder="Search items"
          class="field-input mt-0! h-10 w-full py-0 pl-10 text-sm"
        />
      </div>
    </div>

    <!-- Right: share, avatars, bell, profile — no overlapping layers -->
    <div class="flex items-center gap-0 pr-[94px]">
      <button
        type="button"
        class="text mr-[27px] cursor-pointer leading-none opacity-50 transition-opacity hover:opacity-100"
      >
        Share
      </button>

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
          class="flex cursor-pointer items-center text-panel-label transition-colors hover:text-panel-text"
          :aria-expanded="isNotificationsMenuOpen"
          aria-haspopup="dialog"
          @click="toggleNotificationsMenu"
        >
          <img
            :src="bellIcon"
            alt="Notifications"
            class="h-5 w-5 object-contain"
          />
        </button>

        <NotificationsPopup
          v-if="isNotificationsMenuOpen"
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

      <div class="relative">
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
          class="absolute right-0 top-full z-50 mt-5 w-44 rounded-md border border-panel-input-border bg-panel-bg p-3 shadow-lg"
        >
          <p class="mb-3 text-sm font-semibold text-panel-text">Profile</p>
          <button
            type="button"
            class="w-full rounded px-2 py-2 text-left text-sm text-panel-label transition-colors hover:bg-panel-input-bg hover:text-panel-text disabled:opacity-50"
            :disabled="isLoggingOut"
            @click="handleLogout"
          >
            {{ isLoggingOut ? 'Logging out...' : 'Log out' }}
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
</style>
