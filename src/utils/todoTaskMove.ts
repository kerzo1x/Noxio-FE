import { updateTodoTaskPosition } from '@/api/todoLists'
import type { TodoTask } from '@/stores/types/todoLists.types'
import {
  getApiErrorMessage,
  isInvalidTaskPositionError,
  unwrapCaught,
} from '@/types/errors'
import type { TaskPositionPayload } from '@/utils/todoTaskPosition'

function getEnvelopeErrorCode(envelope: unknown): string | null {
  if (!envelope || typeof envelope !== 'object' || !('code' in envelope)) {
    return null
  }
  const code = (envelope as { code?: string | number }).code
  if (typeof code === 'string' || typeof code === 'number') {
    return String(code)
  }
  return null
}

export async function tryTaskPositionPayloads(
  taskId: string,
  payloads: TaskPositionPayload[],
): Promise<TodoTask> {
  let lastError: object | string | undefined

  for (const body of payloads) {
    try {
      const response = await updateTodoTaskPosition(taskId, body)
      const envelope = response.data

      if (!envelope?.success) {
        if (getEnvelopeErrorCode(envelope) === 'INVALID_TASK_POSITION') {
          lastError = envelope?.message || 'Invalid task position.'
          continue
        }
        throw new Error(envelope?.message || 'Failed to move task.')
      }

      return envelope.data
    } catch (caught) {
      const error = unwrapCaught(caught)
      if (isInvalidTaskPositionError(error)) {
        lastError = error
        continue
      }
      throw caught
    }
  }

  throw new Error(getApiErrorMessage(lastError, 'Failed to move task.'))
}
