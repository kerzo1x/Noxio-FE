<script setup lang="ts">
import NotificationsPopup from '@/components/dashboard/NotificationsPopup.vue'
import defaultAvatar from '@/assets/img/user.svg'
import type { WorkspaceMember } from '@/composables/useWorkspaceMembers'

defineProps<{
  isOpen: boolean
  workspaceName: string
  ownerId: string
  isLoading: boolean
  loadError: string
  searchQuery: string
  filteredMembers: WorkspaceMember[]
  memberDisplayName: (member: WorkspaceMember) => string
  memberRoleLabel: (member: WorkspaceMember, ownerId: string) => string
}>()

const emit = defineEmits<{
  toggle: []
  'update:searchQuery': [value: string]
}>()

const placeholderAvatars = [1, 2, 3]
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="group flex cursor-pointer items-center gap-[1.6875rem] border-0 bg-transparent p-0 leading-none"
      aria-label="Share"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      @click="emit('toggle')"
    >
      <span
        class="share-button-label opacity-50 transition-opacity group-hover:opacity-40"
        aria-hidden="true"
      >
        Share
      </span>
      <span
        class="flex items-center -space-x-2.5 opacity-100 transition-opacity group-hover:opacity-90"
        aria-hidden="true"
      >
        <span
          v-for="i in placeholderAvatars"
          :key="i"
          class="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-panel-bg bg-panel-input-bg"
          :style="{ zIndex: 10 - i }"
        >
          <img
            :src="defaultAvatar"
            class="h-full w-full bg-[#E5E5E5] object-cover"
            alt=""
          />
        </span>
      </span>
    </button>

    <NotificationsPopup
      v-if="isOpen"
      :workspace-name="workspaceName"
      :owner-id="ownerId"
      :is-loading="isLoading"
      :load-error="loadError"
      :search-query="searchQuery"
      :filtered-members="filteredMembers"
      :member-display-name="memberDisplayName"
      :member-role-label="memberRoleLabel"
      @update:search-query="emit('update:searchQuery', $event)"
    />
  </div>
</template>

<style scoped>
.share-button-label {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 150%;
  letter-spacing: -0.011em;
  color: var(--color-brand-white);
}
</style>
