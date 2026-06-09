<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import type { WorkspaceSearchResult } from '@/types/search'

const props = defineProps<{
  modelValue: string
  expanded: boolean
  results: WorkspaceSearchResult[]
  isLoading: boolean
  error: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  input: []
  focus: []
  select: [item: WorkspaceSearchResult]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
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
    props.modelValue.trim().length > 0 &&
    !hasResults.value,
)

function resultLabel(item: WorkspaceSearchResult): string {
  const typeLabels: Record<WorkspaceSearchResult['type'], string> = {
    folder: 'Folders',
    note: 'Note',
    todo_list: 'Todo list',
  }
  return `${item.title} - ${typeLabels[item.type]}`
}

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
  emit('input')
}

function onSelect(item: WorkspaceSearchResult) {
  inputRef.value?.blur()
  emit('select', item)
}
</script>

<template>
  <div class="header-search">
    <!-- Field stays in document flow — header height never changes -->
    <div
      class="header-search__field"
      :class="{ 'header-search__field--expanded': expanded }"
    >
      <svg
        class="header-search__icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        ref="inputRef"
        id="header-search"
        name="header-search"
        :value="modelValue"
        type="text"
        placeholder="Search items"
        autocomplete="off"
        aria-label="Search workspace"
        class="header-search__input"
        @focus="emit('focus')"
        @input="onInput"
      />
    </div>

    <!-- Dropdown overlays below the field, outside header layout -->
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
          <li v-for="item in results" :key="`${item.type}-${item.id}`">
            <button
              type="button"
              class="header-search__line header-search__line--result"
              @mousedown.prevent
              @click="onSelect(item)"
            >
              {{ resultLabel(item) }}
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header-search {
  position: relative;
  width: 100%;
  max-width: 335px;
}

.header-search__field {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  height: 37px;
  padding: 0 12px;
  border: 1.5px solid #212121;
  border-radius: 10px;
  background: #161616;
}

.header-search__field--expanded {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom-color: transparent;
}

.header-search__icon {
  position: absolute;
  left: 12px;
  top: 50%;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  transform: translateY(-50%);
  color: #ffffff;
  opacity: 0.85;
  pointer-events: none;
}

.header-search__input {
  width: 100%;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 8px 0 8px 24px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: -0.132px;
  color: #ffffff;
  outline: none;
}

.header-search__input::placeholder {
  color: var(--panel-placeholder);
}

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

.header-search__list .header-search__line--result {
  padding-top: 11px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.header-search__list li + li .header-search__line--result {
  padding-top: 10px;
}

.header-search__line--result:hover {
  opacity: 0.75;
}

.header-search__line--status {
  cursor: default;
  color: var(--panel-label);
}

.header-search__line--error {
  color: var(--color-error);
}
</style>
