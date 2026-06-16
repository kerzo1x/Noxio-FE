<script setup lang="ts">
import { computed } from 'vue'
import defaultAvatar from '@/assets/img/user.svg'
import type { WorkspaceMember } from '@/composables/useWorkspaceMembers'

const props = defineProps<{
  workspaceName: string
  ownerId: string
  isLoading: boolean
  loadError: string
  inviteEmail: string
  inviteMessage: string
  isInviteError: boolean
  isInviting: boolean
  members: WorkspaceMember[]
  memberDisplayName: (member: WorkspaceMember) => string
  memberRoleLabel: (member: WorkspaceMember, ownerId: string) => string
}>()

const emit = defineEmits<{
  'update:inviteEmail': [value: string]
  invite: []
  'clear-invite-feedback': []
}>()

const sectionTitle = computed(() => {
  const name = props.workspaceName.trim() || 'Workspace'
  return `People in ${name}`
})

function onEmailInput(event: Event) {
  emit('update:inviteEmail', (event.target as HTMLInputElement).value)
  emit('clear-invite-feedback')
}
</script>

<template>
  <div
    class="notifications-popup"
    role="dialog"
    aria-label="Workspace members"
  >
    <div class="notifications-popup__inner">
      <div class="notifications-popup__invite-row">
        <input
          id="notifications-invite-email"
          name="notifications-invite-email"
          :value="inviteEmail"
          type="email"
          placeholder="Email"
          class="notifications-popup__email-input"
          autocomplete="off"
          aria-label="Member email"
          @input="onEmailInput"
          @keydown.enter.prevent="emit('invite')"
        />
        <button
          type="button"
          class="notifications-popup__share-btn"
          :disabled="!inviteEmail.trim() || isInviting"
          @click="emit('invite')"
        >
          {{ isInviting ? 'Sending...' : 'Share' }}
        </button>
      </div>

      <p
        v-if="inviteMessage"
        class="notifications-popup__invite-feedback"
        :class="{ 'notifications-popup__invite-feedback--error': isInviteError }"
      >
        {{ inviteMessage }}
      </p>

      <p class="notifications-popup__section-title">
        {{ sectionTitle }}
      </p>

      <p v-if="isLoading" class="notifications-popup__status">
        Loading members...
      </p>
      <p
        v-else-if="loadError"
        class="notifications-popup__status notifications-popup__status--error"
      >
        {{ loadError }}
      </p>
      <p v-else-if="members.length === 0" class="notifications-popup__status">
        No members yet
      </p>
      <ul v-else class="notifications-popup__list">
        <li
          v-for="member in members"
          :key="member.id"
          class="notifications-popup__item"
        >
          <div class="notifications-popup__member">
            <div class="notifications-popup__avatar">
              <img
                :src="defaultAvatar"
                :alt="memberDisplayName(member)"
                class="notifications-popup__avatar-img"
              />
            </div>
            <div class="notifications-popup__member-text">
              <p class="notifications-popup__member-name">
                {{ memberDisplayName(member) }}
              </p>
              <p class="notifications-popup__member-email">
                {{ member.user.email }}
              </p>
            </div>
          </div>
          <span class="notifications-popup__role">
            {{ memberRoleLabel(member, ownerId) }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.notifications-popup {
  @apply absolute right-0 top-full z-50 mt-5 w-85 max-w-[calc(100vw-2rem)] shrink-0 box-border rounded-lg border border-neutral-800 bg-black px-7 py-6 shadow-lg;
}

.notifications-popup__inner {
  @apply flex w-full flex-col gap-6;
}

.notifications-popup__invite-row {
  @apply flex h-10 w-full items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 pl-2 pr-1;
}

.notifications-popup__email-input {
  @apply h-full min-w-0 flex-1 border-0 bg-transparent px-1 text-xs font-medium tracking-tight text-panel-text outline-none placeholder:text-panel-placeholder;
}

.notifications-popup__share-btn {
  @apply flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-blue-500 px-4 text-xs font-medium tracking-tight text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40;
}

.notifications-popup__invite-feedback {
  @apply -mt-3 text-center text-xs font-medium text-panel-text/70;
}

.notifications-popup__invite-feedback--error {
  @apply text-error;
}

.notifications-popup__section-title {
  @apply text-xs leading-snug text-panel-text;
}

.notifications-popup__list {
  @apply flex max-h-80 flex-col gap-5 overflow-y-auto;
}

.notifications-popup__item {
  @apply flex items-center justify-between gap-10;
}

.notifications-popup__member {
  @apply flex min-w-0 items-center gap-4;
}

.notifications-popup__avatar {
  @apply h-8 w-8 shrink-0 overflow-hidden rounded-full bg-panel-input-bg;
}

.notifications-popup__avatar-img {
  @apply h-full w-full object-cover;
}

.notifications-popup__member-text {
  @apply min-w-0;
}

.notifications-popup__member-name {
  @apply truncate text-xs leading-snug text-panel-text;
}

.notifications-popup__member-email {
  @apply truncate text-xs leading-snug text-panel-text/50;
}

.notifications-popup__role {
  @apply shrink-0 text-xs font-medium leading-snug text-panel-text;
}

.notifications-popup__status {
  @apply py-4 text-center text-xs text-panel-label;
}

.notifications-popup__status--error {
  @apply text-error;
}
</style>
