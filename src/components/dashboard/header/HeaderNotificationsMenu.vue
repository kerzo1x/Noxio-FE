<script setup lang="ts">
import bellIcon from '@/assets/img/bell.svg'

defineProps<{
  isOpen: boolean
  hasNotifications: boolean
  notifications: Array<{ id: string; title: string; read: boolean }>
  isLoading: boolean
}>()

const emit = defineEmits<{
  toggle: []
  refresh: []
}>()
</script>

<template>
  <div class="relative ml-[1.6875rem]">
    <button
      type="button"
      class="relative flex cursor-pointer items-center text-panel-label transition-colors hover:text-panel-text"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      @click="emit('toggle')"
    >
      <img
        :src="bellIcon"
        alt="Notifications"
        class="h-5 w-5 object-contain"
      />
      <span
        v-if="hasNotifications"
        class="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-error"
      />
    </button>

    <div
      v-if="isOpen"
      class="notifications-dropdown"
      role="dialog"
      aria-label="Notifications"
    >
      <div class="notifications-dropdown__header">
        <p class="notifications-dropdown__title">Notifications</p>
        <button
          type="button"
          class="notifications-dropdown__refresh"
          :disabled="isLoading"
          aria-label="Refresh notifications"
          @click="emit('refresh')"
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

      <div v-if="isLoading" class="notifications-dropdown__status">
        Loading notifications...
      </div>
      <div
        v-else-if="notifications.length === 0"
        class="notifications-dropdown__status"
      >
        No notifications
      </div>
      <ul v-else class="notifications-dropdown__list">
        <li
          v-for="notification in notifications"
          :key="notification.id"
          class="notifications-dropdown__item"
        >
          {{ notification.title }}
        </li>
      </ul>
    </div>
  </div>
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
