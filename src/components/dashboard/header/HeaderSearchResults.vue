<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import type { WorkspaceSearchResult } from '@/types/search'
import HeaderSearchResultItem from '@/components/dashboard/header/HeaderSearchResultItem.vue'

const props = defineProps<{
  expanded: boolean
  results: WorkspaceSearchResult[]
  isLoading: boolean
  error: string
  query: string
}>()

const emit = defineEmits<{
  select: [item: WorkspaceSearchResult]
}>()

const resultsContentRef = ref<HTMLElement | null>(null)
const resultsHeight = ref(0)

let resizeObserver: ResizeObserver | null = null

function updateResultsHeight() {
  if (!props.expanded || !resultsContentRef.value) {
    resultsHeight.value = 0
    return
  }
  resultsHeight.value = resultsContentRef.value.scrollHeight
}

function observeResults(el: HTMLElement | null) {
  resizeObserver?.disconnect()
  resizeObserver = null
  if (!el) return
  resizeObserver = new ResizeObserver(() => updateResultsHeight())
  resizeObserver.observe(el)
  updateResultsHeight()
}

watch(
  () =>
    [props.expanded, props.results, props.isLoading, props.error] as const,
  async () => {
    await nextTick()
    updateResultsHeight()
  },
  { deep: true },
)

watch(resultsContentRef, (el) => observeResults(el))

onUnmounted(() => {
  resizeObserver?.disconnect()
})

const hasResults = computed(() => props.results.length > 0)

const showEmpty = computed(
  () =>
    props.expanded &&
    !props.isLoading &&
    !props.error &&
    props.query.trim().length > 0 &&
    !hasResults.value,
)
</script>

<template>
  <div
    class="header-search__dropdown"
    :class="{ 'header-search__dropdown--open': expanded }"
    :style="{ height: expanded ? `${resultsHeight}px` : '0px' }"
    aria-live="polite"
  >
    <div ref="resultsContentRef" class="header-search__dropdown-inner">
      <div class="header-search__divider" role="separator" />

      <p
        v-if="isLoading"
        class="header-search__line header-search__line--status"
      >
        Searching...
      </p>
      <p
        v-else-if="error"
        class="header-search__line header-search__line--status header-search__line--error"
      >
        {{ error }}
      </p>
      <p
        v-else-if="showEmpty"
        class="header-search__line header-search__line--status"
      >
        No results
      </p>

      <ul v-else-if="hasResults" class="header-search__list">
        <HeaderSearchResultItem
          v-for="item in results"
          :key="`${item.type}-${item.id}`"
          :item="item"
          @select="emit('select', $event)"
        />
      </ul>
    </div>
  </div>
</template>

<style scoped>
.header-search__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 70;
  overflow: hidden;
  height: 0;
  margin-top: -1.5px;
  transition: height 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.header-search__dropdown--open {
  pointer-events: auto;
}

.header-search__dropdown-inner {
  border: 1.5px solid #212121;
  border-top: none;
  border-radius: 0 0 10px 10px;
  background: #161616;
  padding-bottom: 12px;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.35);
}

.header-search__divider {
  height: 1px;
  background: #212121;
}

.header-search__list {
  display: flex;
  flex-direction: column;
  max-height: 240px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.header-search__list::-webkit-scrollbar {
  display: none;
}

.header-search__list :deep(li + li .header-search__line--result) {
  padding-top: 10px;
}

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

.header-search__line--status {
  cursor: default;
  color: var(--panel-label);
}

.header-search__line--error {
  color: var(--color-error);
}
</style>
