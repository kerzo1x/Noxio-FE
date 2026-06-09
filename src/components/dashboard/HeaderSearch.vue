<script setup lang="ts">
import { ref } from 'vue'
import type { WorkspaceSearchResult } from '@/types/search'
import HeaderSearchInput from '@/components/dashboard/header/HeaderSearchInput.vue'
import HeaderSearchResults from '@/components/dashboard/header/HeaderSearchResults.vue'

defineProps<{
  modelValue: string
  expanded: boolean
  results: WorkspaceSearchResult[]
  isLoading: boolean
  error: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: []
  input: []
  select: [item: WorkspaceSearchResult]
}>()

const inputRef = ref<InstanceType<typeof HeaderSearchInput> | null>(null)

function onSelect(item: WorkspaceSearchResult) {
  inputRef.value?.blur()
  emit('select', item)
}
</script>

<template>
  <div class="header-search">
    <HeaderSearchInput
      ref="inputRef"
      :model-value="modelValue"
      :expanded="expanded"
      @update:model-value="emit('update:modelValue', $event)"
      @focus="emit('focus')"
      @input="emit('input')"
    />
    <HeaderSearchResults
      :expanded="expanded"
      :results="results"
      :is-loading="isLoading"
      :error="error"
      :query="modelValue"
      @select="onSelect"
    />
  </div>
</template>

<style scoped>
.header-search {
  position: relative;
  width: 100%;
  max-width: 335px;
}
</style>
