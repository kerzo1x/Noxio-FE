<script setup lang="ts">
import FolderCardContextMenu from '@/components/dashboard/FolderCardContextMenu.vue'

export type DashboardCardVariant = 'folder' | 'todo'

const props = defineProps<{
  variant: DashboardCardVariant
  title: string
  subtitle: string | null
  imageSrc: string
  imageAlt: string
  menuOpen: boolean
  accentStyle?: Record<string, string>
}>()

const emit = defineEmits<{
  open: []
  'update:menuOpen': [open: boolean]
  edit: []
  delete: []
}>()

const cardClass =
  props.variant === 'folder' ? 'folder-card' : 'todo-card'
</script>

<template>
  <!-- TODO: tu ti chyba @keydown.space -->
  <div
    role="button"
    tabindex="0"
    :class="cardClass"
    @click="emit('open')"
    @keydown.enter="emit('open')"
  >
    <div class="relative h-full w-full overflow-hidden">
      <img
        :src="imageSrc"
        :alt="imageAlt"
        class="absolute inset-0 h-full w-full"
      />
      <div
        v-if="variant === 'todo' && accentStyle"
        class="pointer-events-none absolute bottom-0 left-0 right-0 h-2 rounded-b-[var(--radius-card)]"
        :style="accentStyle"
      />
    </div>
    <div class="absolute inset-0 flex items-start justify-between">
      <div :class="variant === 'folder' ? 'ml-3 mt-[31px]' : 'ml-2.5 mt-[19px]'">
        <h3 class="text-sm font-medium text-white">{{ title }}</h3>
        <p v-if="subtitle" class="mt-[0.94px] text-[11px] text-white/40">
          {{ subtitle }}
        </p>
      </div>
      <FolderCardContextMenu
        :class="variant === 'todo' ? '!mt-[19px]' : ''"
        :model-value="menuOpen"
        @click.stop
        @update:model-value="emit('update:menuOpen', $event)"
        @edit="emit('edit')"
        @delete="emit('delete')"
      />
    </div>
  </div>
</template>

