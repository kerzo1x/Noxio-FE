<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';

import defaultAvatar from '@/assets/img/user.svg';
import bellIcon from '@/assets/img/bell.svg';
import arrowIcon from '@/assets/img/arrow.svg';

const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const userName = computed(() => {
  if (!user.value) return 'Loading...';
  return `${user.value.name} ${user.value.surname}`;
});

const avatarUrl = computed(() => {
  return user.value?.avatar || defaultAvatar;
});

const searchQuery = ref('');
const hasNotifications = ref(false);

const sharedUsers = [1, 2, 3]; 
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

        <button class="relative text-panel-label hover:text-panel-text transition-colors cursor-pointer flex items-center shrink-0 mr-[30px]">
          <img :src="bellIcon" alt="Notifications" class="w-5 h-5 object-contain" />
          <span v-if="hasNotifications" class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-error rounded-full" />
        </button>
      </div>

      <div class="flex items-center justify-end gap-[7px] cursor-pointer group mr-[94px]">
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