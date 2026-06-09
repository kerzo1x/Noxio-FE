import type { JsonObject, JsonValue } from '@/types/json'
import { isJsonObject } from '@/types/json'

export interface ApiErrorBody {
  message?: string
  success?: boolean
  code?: string | number
}

export interface AxiosLikeError {
  response?: {
    status?: number
    data?: ApiErrorBody | JsonObject
  }
}

/** Normalizes values from catch bindings (TS reports them as unknown). */
export function unwrapCaught(caught: unknown): object | string | undefined {
  if (caught === null || caught === undefined) return undefined
  if (typeof caught === 'object' || typeof caught === 'string') return caught
  if (typeof caught === 'number' || typeof caught === 'boolean') return String(caught)
  return undefined
}

export function isAxiosLikeError(value: object): value is AxiosLikeError {
  return 'response' in value
}

export function getApiErrorCode(error: object | string | undefined): string | null {
  if (!error || typeof error === 'string') return null

  if (isAxiosLikeError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object' && 'code' in data) {
      const code = (data as ApiErrorBody).code
      if (typeof code === 'string' || typeof code === 'number') {
        return String(code)
      }
    }
  }

  return null
}

export function isInvalidTaskPositionError(error: object | string | undefined): boolean {
  return getApiErrorCode(error) === 'INVALID_TASK_POSITION'
}

export function getApiErrorMessage(
  error: object | string | undefined,
  fallback: string,
  notFoundMessage?: string,
): string {
  if (typeof error === 'string') return error
  if (!error) return fallback

  if (isAxiosLikeError(error)) {
    const res = error.response
    const data = res?.data
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as ApiErrorBody).message
      if (typeof message === 'string') return message
    }
    if (res?.status === 404 && notFoundMessage) return notFoundMessage
  }

  if (error instanceof Error) return error.message
  return fallback
}

export function isRetriableApiError(error: object | string | undefined): boolean {
  if (!error || typeof error === 'string') return true
  if (!isAxiosLikeError(error)) return true

  const status = error.response?.status
  if (status && status >= 400 && status < 500) return false
  return true
}

export function toError(error: object | string | undefined): Error {
  if (error instanceof Error) return error
  return new Error(getApiErrorMessage(error, 'An unexpected error occurred'))
}

export function jsonValueToNoteSearchRoot(body: JsonValue | undefined): JsonObject | null {
  if (!isJsonObject(body)) return null
  return body
}
