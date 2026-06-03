<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import AddTodoListPopup from '@/components/dashboard/AddTodoListPopup.vue'
import DeleteTodoListPopup from '@/components/dashboard/DeleteTodoListPopup.vue'
import EditTodoListPopup from '@/components/dashboard/EditTodoListPopup.vue'
import FolderCardContextMenu from '@/components/dashboard/FolderCardContextMenu.vue'
import toDoFolder from '@/assets/img/ToDoFolder.svg'
import { useTodoListsStore, type TodoList } from '@/stores/todoLists'

interface TodoListWithTasksCount extends TodoList {
  tasksCount?: number | null
}

const router = useRouter()
const todoListsStore = useTodoListsStore()
const showAddTodoListPopup = ref(false)

function openTodoList(todoListId: string) {
  router.push({
    name: 'DashboardTodoList',
    params: { todoListId },
  })
}
const showEditPopup = ref(false)
const showDeletePopup = ref(false)
const todoListToEdit = ref<TodoList | null>(null)
const todoListToDelete = ref<TodoList | null>(null)
const menuOpenTodoListId = ref<string | null>(null)

function handleEdit(todoList: TodoList) {
  todoListToEdit.value = todoList
  showEditPopup.value = true
}

function handleDelete(todoList: TodoList) {
  todoListToDelete.value = todoList
  showDeletePopup.value = true
}

function isMenuOpen(todoListId: string) {
  return menuOpenTodoListId.value === todoListId
}

function setMenuOpen(todoListId: string, open: boolean) {
  menuOpenTodoListId.value = open ? todoListId : null
}

const getTasksLabel = (todoList: TodoList): string | null => {
  const tasksCount = (todoList as TodoListWithTasksCount).tasksCount
  return typeof tasksCount === 'number' ? `${tasksCount} tasks` : null
}

const normalizeCssColor = (color: string | null): string | null => {
  if (!color) {
    return null
  }

  const trimmedColor = color.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(trimmedColor)) {
    return trimmedColor
  }

  if (/^[0-9a-fA-F]{6}$/.test(trimmedColor)) {
    return `#${trimmedColor}`
  }

  return null
}

const getCardAccentStyle = (color: string | null) => {
  const cssColor = normalizeCssColor(color)
  if (!cssColor) {
    return {}
  }

  return {
    backgroundColor: cssColor
  }
}
</script>

<template>
  <section class="dashboard-page-column">
    <header
      class="sticky mb-5 top-0 z-10 shrink-0 -mx-1 bg-black px-1 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.45)]"
    >
      <div class="flex items-center justify-between">
        <h1 class="text-[20px] font-medium tracking-[-0.011em] text-white">
          To do Lists
        </h1>
        <div class="h-[29px] w-[203px]">
          <BaseButton
            text="Add To do List"
            class="h-[29px]! rounded-[10px]! px-[10px]! py-0! font-medium! text-[12px]! leading-[150%]!"
            @click="showAddTodoListPopup = true"
          />
        </div>
      </div>
    </header>

    <div
      class="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-[74px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div class="grid w-full grid-cols-4 gap-[20px]">
        <div
          v-for="todoList in todoListsStore.todoLists"
          :key="todoList.id"
          role="button"
          tabindex="0"
          class="relative h-[163px] w-[202px] cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
          @click="openTodoList(todoList.id)"
          @keydown.enter="openTodoList(todoList.id)"
        >
          <div class="relative h-full w-full overflow-hidden">
            <img :src="toDoFolder" :alt="todoList.name" class="absolute inset-0 h-full w-full" />
            <div
              class="pointer-events-none absolute bottom-0 left-0 right-0 h-[8px] rounded-b-[10px]"
              :style="getCardAccentStyle(todoList.color)"
            />
          </div>
          <div class="absolute inset-0 flex items-start justify-between">
            <div class="ml-[10px] mt-[19px]">
              <h3 class="text-sm font-medium text-white">{{ todoList.name }}</h3>
              <p v-if="getTasksLabel(todoList)" class="mt-[0.94px] text-[11px] text-white/40">
                {{ getTasksLabel(todoList) }}
              </p>
            </div>
            <FolderCardContextMenu
              class="!mt-[19px]"
              :model-value="isMenuOpen(todoList.id)"
              @click.stop
              @update:model-value="setMenuOpen(todoList.id, $event)"
              @edit="handleEdit(todoList)"
              @delete="handleDelete(todoList)"
            />
          </div>
        </div>
      </div>
    </div>

    <div
      class="pointer-events-none sticky bottom-0 z-[1px] h-[2px] w-full bg-black shadow-[0_-3px_10px_-1px_rgba(0,0,0,0.35)]"
      aria-hidden="true"
    />

    <AddTodoListPopup v-model="showAddTodoListPopup" />
    <EditTodoListPopup v-model="showEditPopup" :todo-list="todoListToEdit" />
    <DeleteTodoListPopup v-model="showDeletePopup" :todo-list="todoListToDelete" />
  </section>
</template>
