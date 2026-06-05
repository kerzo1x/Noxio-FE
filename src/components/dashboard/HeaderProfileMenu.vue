<script setup lang="ts">
import arrowIcon from '@/assets/img/arrow.svg'
import settingsIcon from '@/assets/img/settings.svg'
import exitIcon from '@/assets/img/exit.svg'
import defaultAvatar from '@/assets/img/user.svg'

defineProps<{
  isOpen: boolean
  userName: string
  avatarUrl: string
  isLoggingOut: boolean
}>()

const emit = defineEmits<{
  toggle: []
  settings: []
  logout: []
}>()
</script>

<template>
  <div class="relative ml-[4.375rem]">
    <button
      type="button"
      class="group flex cursor-pointer items-center justify-end gap-[0.9375rem]"
      :aria-expanded="isOpen"
      @click="emit('toggle')"
    >
      <div class="h-8 w-8 shrink-0 overflow-hidden rounded-full">
        <img
          :src="avatarUrl"
          :alt="userName"
          class="h-full w-full object-cover"
          @error="($event.target as HTMLImageElement).src = defaultAvatar"
        />
      </div>

      <span class="flex min-w-0 items-center gap-[0.75rem]">
        <span class="header-profile-name truncate opacity-75 transition-opacity group-hover:opacity-100">
          {{ userName }}
        </span>
        <img
          :src="arrowIcon"
          class="h-4 w-4 shrink-0 opacity-60 transition-opacity group-hover:opacity-100"
          alt=""
        />
      </span>
    </button>

    <div v-if="isOpen" class="profile-menu" role="menu">
      <button
        type="button"
        class="profile-menu__action profile-menu__action--settings"
        role="menuitem"
        @click="emit('settings')"
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
        @click="emit('logout')"
      >
        <span>{{ isLoggingOut ? 'Logging out...' : 'Log out' }}</span>
        <img :src="exitIcon" alt="" class="h-5 w-5 shrink-0" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.header-profile-name {
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
  border: 1px solid var(--color-dashboard-border);
  border-radius: var(--radius-card);
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
  color: var(--color-danger);
}
</style>
