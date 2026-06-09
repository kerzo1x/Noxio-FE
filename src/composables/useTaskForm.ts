import { ref } from 'vue'
import { useTodoListsStore } from '@/stores/todoLists'
import { deadlineToIso } from '@/utils/taskDeadline'

export function useTaskForm() {
  const todoListsStore = useTodoListsStore()

  const title = ref('')
  const description = ref('')
  const deadline = ref('')
  const isSubmitting = ref(false)
  const isError = ref(false)
  const message = ref('')
  const showDeadlineError = ref(false)

  function reset() {
    title.value = ''
    description.value = ''
    deadline.value = ''
    isSubmitting.value = false
    isError.value = false
    showDeadlineError.value = false
    message.value = ''
  }

  function clearError() {
    isError.value = false
    showDeadlineError.value = false
    message.value = ''
  }

  async function submit(
    todoListId: string,
    categoryId: string | null,
  ): Promise<boolean> {
    const trimmed = title.value.trim()
    if (!trimmed || isSubmitting.value) return false

    if (!todoListId) {
      isError.value = true
      message.value = 'Todo list not found.'
      return false
    }

    if (deadline.value.trim() && !deadlineToIso(deadline.value)) {
      isError.value = true
      showDeadlineError.value = true
      message.value = 'Enter a valid deadline (e.g. 10.5.2026).'
      return false
    }

    isSubmitting.value = true
    isError.value = false
    message.value = ''

    try {
      await todoListsStore.createTodoTask(todoListId, {
        title: trimmed,
        description: description.value,
        categoryId,
        deadlineAt: deadline.value.trim()
          ? deadlineToIso(deadline.value)
          : null,
        status: 'TODO',
      })
      return true
    } catch (err) {
      isError.value = true
      message.value =
        err instanceof Error ? err.message : 'Failed to create task.'
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    title,
    description,
    deadline,
    isSubmitting,
    isError,
    message,
    showDeadlineError,
    reset,
    clearError,
    submit,
  }
}
