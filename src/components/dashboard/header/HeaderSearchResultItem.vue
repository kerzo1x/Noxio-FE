<script setup lang="ts">
import type { WorkspaceSearchResult } from '@/types/search'

defineProps<{
  item: WorkspaceSearchResult
}>()

const emit = defineEmits<{
  select: [item: WorkspaceSearchResult]
}>()

function resultLabel(item: WorkspaceSearchResult): string {
  const typeLabels: Record<WorkspaceSearchResult['type'], string> = {
    folder: 'Folders',
    note: 'Note',
    todo_list: 'Todo list',
  }
  return `${item.title} - ${typeLabels[item.type]}`
}
</script>

<template>
  <li>
    <button
      type="button"
      class="header-search__line header-search__line--result"
      @mousedown.prevent
      @click="emit('select', item)"
    >
      {{ resultLabel(item) }}
    </button>
  </li>
</template>

<style scoped>
.header-search__line {
  display: block;
  width: 100%;
  margin: 0;
  padding: 11px 12px 0 36px;
  border: none;
  background: transparent;
  text-align: left;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: -0.132px;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-search__line--result {
  padding-top: 11px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.header-search__line--result:hover {
  opacity: 0.75;
}
</style>
