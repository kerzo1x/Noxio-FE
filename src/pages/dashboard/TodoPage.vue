<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader.vue'
import DashboardFolderCard from '@/components/dashboard/DashboardFolderCard.vue'
import AddTodoListPopup from '@/components/dashboard/AddTodoListPopup.vue'
import DeleteTodoListPopup from '@/components/dashboard/DeleteTodoListPopup.vue'
import EditTodoListPopup from '@/components/dashboard/EditTodoListPopup.vue'
import toDoFolder from '@/assets/img/ToDoFolder.svg'
import { useTodoListsStore, type TodoList } from '@/stores/todoLists'

interface TodoListWithTasksCount extends TodoList {
  tasksCount?: number | null
}

const router = useRouter()
const todoListsStore = useTodoListsStore()
const showAddTodoListPopup = ref(false)
const showEditPopup = ref(false)
const showDeletePopup = ref(false)
const todoListToEdit = ref<TodoList | null>(null)
const todoListToDelete = ref<TodoList | null>(null)
const menuOpenTodoListId = ref<string | null>(null)

function openTodoList(todoListId: string) {
  router.push({
    name: 'DashboardTodoList',
    params: { todoListId },
  })
}

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

function getTasksLabel(todoList: TodoList): string | null {
  const tasksCount = (todoList as TodoListWithTasksCount).tasksCount
  if (typeof tasksCount !== 'number') return null
  return `${tasksCount} tasks`
}

function normalizeCssColor(color: string | null): string | null {
  if (!color) return null
  const trimmedColor = color.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(trimmedColor)) return trimmedColor
  if (/^[0-9a-fA-F]{6}$/.test(trimmedColor)) return `#${trimmedColor}`
  return null
}

function getCardAccentStyle(color: string | null) {
  const cssColor = normalizeCssColor(color)
  if (!cssColor) return undefined
  return { backgroundColor: cssColor }
}
</script>

<template>
  <section class="dashboard-page-column">
    <DashboardPageHeader title="To do Lists">
      <template #action>
        <BaseButton
          text="Add To do List"
          class="!h-full !w-full !rounded-card !px-2.5 !py-0 !font-medium !text-xs !leading-normal"
          @click="showAddTodoListPopup = true"
        />
      </template>
    </DashboardPageHeader>

    <div
      class="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-[74px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div class="grid w-full grid-cols-4 grid-todos">
        <DashboardFolderCard
          v-for="todoList in todoListsStore.todoLists"
          :key="todoList.id"
          variant="todo"
          :title="todoList.name"
          :subtitle="getTasksLabel(todoList)"
          :image-src="toDoFolder"
          :image-alt="todoList.name"
          :menu-open="isMenuOpen(todoList.id)"
          :accent-style="getCardAccentStyle(todoList.color)"
          @open="openTodoList(todoList.id)"
          @update:menu-open="setMenuOpen(todoList.id, $event)"
          @edit="handleEdit(todoList)"
          @delete="handleDelete(todoList)"
        />
      </div>
    </div>

    <!-- TODO: preco je tu z-[1px]? to je nevalidna hodnota, daj tam cislo -->
    <div
      class="pointer-events-none sticky bottom-0 z-[1px] h-0.5 w-full bg-black dashboard-bottom-fade"
      aria-hidden="true"
    />

    <AddTodoListPopup v-model="showAddTodoListPopup" />
    <EditTodoListPopup v-model="showEditPopup" :todo-list="todoListToEdit" />
    <DeleteTodoListPopup v-model="showDeletePopup" :todo-list="todoListToDelete" />
  </section>
</template>
