<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ColorSwatchRow from '@/components/ui/color/ColorSwatchRow.vue'
import {
  createTaskCategory,
  listTaskCategories,
  type TaskCategory,
} from '@/api/taskCategories'
import { useWorkspaceStore } from '@/stores/workspace'
import { fromApiColor, toApiColor } from '@/utils/colorUtils'

const props = defineProps<{
  todoListId: string
}>()

const selectedCategoryId = defineModel<string | null>({ default: null })
const categoryDropdownOpen = defineModel<boolean>('categoryDropdownOpen', {
  default: false,
})
const createCategoryOpen = defineModel<boolean>('createCategoryOpen', {
  default: false,
})
const categoryPickerOpen = defineModel<boolean>('categoryPickerOpen', {
  default: false,
})

const emit = defineEmits<{
  clearError: []
  error: [message: string]
}>()

const workspaceStore = useWorkspaceStore()

const CATEGORY_PRESETS = ['#3C6EEC', '#EAE35F', '#AD2222'] as const
const DEFAULT_CATEGORY_COLOR = CATEGORY_PRESETS[0]

const categories = ref<TaskCategory[]>([])
const categoriesLoading = ref(false)
const newCategoryName = ref('')
const newCategoryColor = ref<string>(DEFAULT_CATEGORY_COLOR)
const isCreatingCategory = ref(false)

const categoryTriggerRef = ref<HTMLElement | null>(null)
const categoryDropdownRef = ref<HTMLElement | null>(null)
const createCategoryPanelRef = ref<HTMLElement | null>(null)

const selectedCategory = computed(() =>
  categories.value.find((c) => c.id === selectedCategoryId.value) ?? null,
)

const categoryPillStyle = computed(() => {
  if (!selectedCategory.value) {
    return { backgroundColor: 'var(--color-dashboard-surface)' }
  }
  return { backgroundColor: fromApiColor(selectedCategory.value.color) }
})

const categoryPillLabel = computed(
  () => selectedCategory.value?.name ?? 'Select',
)

function categoryPillStyleFor(category: TaskCategory) {
  return { backgroundColor: fromApiColor(category.color) }
}

async function fetchCategories() {
  const workspaceId = workspaceStore.activeWorkspace?.id
  if (!workspaceId) {
    categories.value = []
    return
  }

  categoriesLoading.value = true
  try {
    const response = await listTaskCategories(workspaceId)
    const payload = response.data
    if (payload?.success) {
      categories.value = payload.data.filter(
        (c) => c.todoListId === props.todoListId || c.todoListId === null,
      )
    } else {
      categories.value = []
    }
  } catch {
    categories.value = []
  } finally {
    categoriesLoading.value = false
  }
}

onMounted(() => {
  void fetchCategories()
})

watch(
  () => props.todoListId,
  () => {
    void fetchCategories()
  },
)

function toggleCategoryDropdown() {
  categoryDropdownOpen.value = !categoryDropdownOpen.value
  if (!categoryDropdownOpen.value) {
    createCategoryOpen.value = false
  }
}

function selectCategory(categoryId: string) {
  selectedCategoryId.value = categoryId
  categoryDropdownOpen.value = false
  createCategoryOpen.value = false
  emit('clearError')
}

function openCreateCategoryPanel() {
  categoryDropdownOpen.value = true
  createCategoryOpen.value = true
  newCategoryName.value = ''
  newCategoryColor.value = DEFAULT_CATEGORY_COLOR
}

async function handleCreateCategory() {
  const trimmedName = newCategoryName.value.trim()
  if (!trimmedName || isCreatingCategory.value) return

  const workspaceId = workspaceStore.activeWorkspace?.id
  if (!workspaceId) {
    emit('error', 'No workspace selected.')
    return
  }

  isCreatingCategory.value = true

  try {
    const response = await createTaskCategory(workspaceId, {
      name: trimmedName,
      color: toApiColor(newCategoryColor.value),
      todoListId: props.todoListId,
    })
    const envelope = response.data
    if (!envelope?.success) {
      throw new Error(envelope?.message || 'Failed to create category.')
    }

    categories.value = [...categories.value, envelope.data]
    selectedCategoryId.value = envelope.data.id
    createCategoryOpen.value = false
    categoryDropdownOpen.value = false
    categoryPickerOpen.value = false
  } catch (err) {
    emit(
      'error',
      err instanceof Error ? err.message : 'Failed to create category.',
    )
  } finally {
    isCreatingCategory.value = false
  }
}

function reset() {
  selectedCategoryId.value = null
  categoryDropdownOpen.value = false
  createCategoryOpen.value = false
  categoryPickerOpen.value = false
  newCategoryName.value = ''
  newCategoryColor.value = DEFAULT_CATEGORY_COLOR
  isCreatingCategory.value = false
}

defineExpose({
  categoryTriggerRef,
  categoryDropdownRef,
  createCategoryPanelRef,
  reset,
})
</script>

<template>
  <div class="task-popup-meta-row task-popup-category-row">
    <span class="task-popup-meta-label">Category</span>
    <button
      ref="categoryTriggerRef"
      type="button"
      class="task-popup-category-pill"
      :class="{
        'task-popup-category-pill--placeholder': !selectedCategory,
      }"
      :style="categoryPillStyle"
      :aria-expanded="categoryDropdownOpen"
      aria-haspopup="listbox"
      @click.stop="toggleCategoryDropdown"
    >
      {{ categoryPillLabel }}
    </button>

    <div
      v-if="categoryDropdownOpen && !createCategoryOpen"
      ref="categoryDropdownRef"
      class="task-popup-category-dropdown"
      role="listbox"
      @click.stop
    >
      <p v-if="categoriesLoading" class="task-popup-category-dropdown-empty">
        Loading...
      </p>
      <template v-else>
        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          class="task-popup-category-option"
          :style="categoryPillStyleFor(category)"
          role="option"
          :aria-selected="selectedCategoryId === category.id"
          @click="selectCategory(category.id)"
        >
          {{ category.name }}
        </button>
        <p
          v-if="categories.length === 0"
          class="task-popup-category-dropdown-empty"
        >
          No categories yet
        </p>
      </template>

      <button
        type="button"
        class="task-popup-create-category-trigger"
        @click.stop="openCreateCategoryPanel"
      >
        Create category
      </button>
    </div>

    <div
      v-if="createCategoryOpen"
      ref="createCategoryPanelRef"
      class="task-popup-create-category"
      @click.stop
    >
      <input
        v-model="newCategoryName"
        type="text"
        name="category-name"
        placeholder="Category name"
        class="task-popup-create-category-name"
        autocomplete="off"
      />

      <ColorSwatchRow
        v-model="newCategoryColor"
        v-model:picker-open="categoryPickerOpen"
        :presets="CATEGORY_PRESETS"
        size="sm"
        picker-panel-class="task-popup-category-picker"
      />

      <button
        type="button"
        class="task-popup-create-category-submit"
        :disabled="isCreatingCategory || !newCategoryName.trim()"
        @click="handleCreateCategory"
      >
        {{ isCreatingCategory ? 'Loading...' : 'Create category' }}
      </button>
    </div>
  </div>
</template>
