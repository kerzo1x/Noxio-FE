<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import AddTodoListPopup from '@/components/dashboard/AddTodoListPopup.vue'
import toDoFolder from '@/assets/img/ToDoFolder.svg'
import dotsIcon from '@/assets/img/dots.svg'
import { useTodoListsStore, type TodoList } from '@/stores/todoLists'

interface TodoListWithTasksCount extends TodoList {
  tasksCount?: number | null
}

const todoListsStore = useTodoListsStore()
const showAddTodoListPopup = ref(false)

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
  <section class="isolate flex h-full min-h-0 w-full max-w-[858px] flex-col">
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
      <div class="grid grid-cols-4 gap-[21px]">
        <div
          v-for="todoList in todoListsStore.todoLists"
          :key="todoList.id"
          class="relative h-[146px] w-[186px] cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
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
            <button
              type="button"
              class="mr-[12px] mt-[19px] flex h-[19.55px] w-[19.55px] cursor-pointer items-center justify-center rounded-full bg-black/30 text-white/70 transition-colors hover:bg-black/70 hover:text-white"
              @click.stop
            >
              <img :src="dotsIcon" alt="" class="h-[2px] w-[9px]" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      class="pointer-events-none sticky bottom-0 z-[1px] h-[2px] w-full bg-black shadow-[0_-3px_10px_-1px_rgba(0,0,0,0.35)]"
      aria-hidden="true"
    />

    <AddTodoListPopup v-model="showAddTodoListPopup" />
  </section>
</template>
