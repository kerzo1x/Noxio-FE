<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';
import api from '@/api';

import defaultAvatar from '@/assets/img/user.svg';
import bellIcon from '@/assets/img/bell.svg';
import arrowIcon from '@/assets/img/arrow.svg';

const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const router = useRouter();
const props = defineProps<{
  hasNotifications: boolean;
  notifications: Array<{ id: string; title: string; read: boolean }>;
  isNotificationsLoading: boolean;
}>();
const emit = defineEmits<{
  (event: 'refresh-notifications'): void;
}>();

const userName = computed(() => {
  if (!user.value) return 'Loading...';
  return `${user.value.name} ${user.value.surname}`;
});

const avatarUrl = computed(() => {
  return user.value?.avatar || defaultAvatar;
});

const searchQuery = ref('');
const isProfileMenuOpen = ref(false);
const isNotificationsMenuOpen = ref(false);
const isLoggingOut = ref(false);

const sharedUsers = [1, 2, 3]; 

async function handleLogout() {
  if (isLoggingOut.value) return;

  isLoggingOut.value = true;
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout request failed:', error);
  } finally {
    localStorage.clear();
    userStore.user = null;
    isProfileMenuOpen.value = false;
    isLoggingOut.value = false;
    router.push({ name: 'Login' });
  }
}

function handleRefreshNotifications() {
  emit('refresh-notifications');
}

function toggleNotificationsMenu() {
  isNotificationsMenuOpen.value = !isNotificationsMenuOpen.value;
  if (isNotificationsMenuOpen.value) {
    isProfileMenuOpen.value = false;
  }
}

function toggleProfileMenu() {
  isProfileMenuOpen.value = !isProfileMenuOpen.value;
  if (isProfileMenuOpen.value) {
    isNotificationsMenuOpen.value = false;
  }
}
</script>

<template>
  <header class="relative h-16 flex items-center bg-panel-bg border-b border-panel-input-border/50">
    
    <div class="w-[283px] shrink-0"></div>
    <div class="absolute inset-y-0 left-[283px] right-0 flex items-center justify-center">
      <div class="w-[873px] ml-[5.83vw] mr-[8.96vw] flex justify-start shrink-0">
        <div class="relative group w-[335px]">
        <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 text-panel-placeholder group-focus-within:text-panel-text transition-colors pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search items"
          class="field-input mt-0! pl-10 h-10 py-0 text-sm w-full"
        />
        </div>
      </div>
    </div>

    <div class="flex-1 flex items-center justify-end">
      
      <div class="h-[24px] flex items-center justify-between">
        <div class="flex items-center">
          <button class="text opacity-50 hover:opacity-100 transition-opacity cursor-pointer leading-none mr-[27px]">
            Share
          </button>
          
          <div class="flex items-center -space-x-2.5 mr-[64px]">
            <div 
              v-for="i in sharedUsers" 
              :key="i"
              class="w-6 h-6 rounded-full border-2 border-panel-bg bg-panel-input-bg flex items-center justify-center overflow-hidden"
              :style="{ zIndex: 10 - i }"
            >
              <img :src="defaultAvatar" class="w-full h-full object-cover bg-[#E5E5E5]" />
            </div>
          </div>
        </div>

        <button
          type="button"
          class="relative text-panel-label hover:text-panel-text transition-colors cursor-pointer flex items-center shrink-0 mr-[30px]"
          @click="toggleNotificationsMenu"
        >
          <img :src="bellIcon" alt="Notifications" class="w-5 h-5 object-contain" />
          <span v-if="props.hasNotifications" class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-error rounded-full" />
        </button>
        <div
          v-if="isNotificationsMenuOpen"
          class="absolute right-[132px] top-12 mt-5 w-[320px] rounded-md border border-panel-input-border bg-panel-bg p-3 shadow-lg z-20"
        >
          <div class="mb-3 flex items-center justify-between">
            <p class="text-sm font-semibold text-panel-text">Notifications</p>
            <button
              type="button"
              class="rounded p-1 text-panel-label hover:bg-panel-input-bg hover:text-panel-text transition-colors disabled:opacity-50"
              :disabled="props.isNotificationsLoading"
              @click="handleRefreshNotifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15.55-6.36L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15.55 6.36L3 16" />
              </svg>
            </button>
          </div>

          <div v-if="props.isNotificationsLoading" class="py-6 text-center text-sm text-panel-label">
            Loading notifications...
          </div>
          <div v-else-if="props.notifications.length === 0" class="py-6 text-center text-sm text-panel-label">
            No notifications
          </div>
          <ul v-else class="max-h-72 overflow-y-auto">
            <li
              v-for="notification in props.notifications"
              :key="notification.id"
              class="rounded px-2 py-2 text-sm text-panel-text hover:bg-panel-input-bg"
            >
              {{ notification.title }}
            </li>
          </ul>
        </div>
      </div>

      <div class="relative mr-[94px]">
        <button
          type="button"
          class="flex items-center justify-end gap-[7px] cursor-pointer group"
          @click="toggleProfileMenu"
        >
          <div class="w-8 h-8 rounded-full overflow-hidden border border-panel-input-border bg-panel-input-bg">
            <img
              :src="avatarUrl"
              :alt="userName"
              class="w-full h-full object-cover"
              @error="($event.target as HTMLImageElement).src = defaultAvatar"
            />
          </div>

          <span class="text truncate opacity-75 group-hover:opacity-100 transition-opacity">
            {{ userName }}
          </span>

          <img :src="arrowIcon" class="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" alt="arrow" />
        </button>

        <div
          v-if="isProfileMenuOpen"
          class="absolute right-0 mt-5 w-44 rounded-md border border-panel-input-border bg-panel-bg p-3 shadow-lg z-20"
        >
          <div class="mb-3 flex items-center justify-between">
            <p class="text-sm font-semibold text-panel-text">Profile</p>
          </div>
          <button
            type="button"
            class="w-full rounded px-2 py-2 text-left text-sm text-panel-label hover:bg-panel-input-bg hover:text-panel-text transition-colors disabled:opacity-50"
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