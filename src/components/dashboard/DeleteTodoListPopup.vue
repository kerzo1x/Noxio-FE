<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import DeleteConfirmPopup from '@/components/dashboard/DeleteConfirmPopup.vue'
import { useTodoListsStore, type TodoList } from '@/stores/todoLists'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  todoList: TodoList | null
}>()

const emit = defineEmits<{
  deleted: [todoListId: string]
}>()

const todoListsStore = useTodoListsStore()

const isSubmitting = ref(false)
const message = ref('')

function resetForm() {
  message.value = ''
  isSubmitting.value = false
}

function close() {
  resetForm()
  open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) resetForm()
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) close()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

async function handleDelete() {
  if (isSubmitting.value || !props.todoList) return

  isSubmitting.value = true
  message.value = ''

  const todoListId = props.todoList.id

  try {
    await todoListsStore.deleteTodoList(todoListId)
    emit('deleted', todoListId)
    close()
  } catch (err) {
    message.value =
      err instanceof Error ? err.message : 'Failed to delete todo list.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <DeleteConfirmPopup
    v-if="todoList"
    v-model="open"
    title-id="delete-todo-list-popup-message"
    message="Are you sure you want to delete your to do with all content inside?"
    :error-message="message"
    :is-submitting="isSubmitting"
    @confirm="handleDelete"
    @close="close"
  />
</template>
