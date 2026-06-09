import { getApiErrorMessage as getApiErrorMessageFromErrors } from '@/types/errors'
import { useWorkspaceStore } from '@/stores/workspace'

export function resolveWorkspaceId(storeLoadedId: string | null): string | null {
  const activeId = useWorkspaceStore().activeWorkspace?.id ?? null
  return activeId ?? storeLoadedId
}

export const getApiErrorMessage = getApiErrorMessageFromErrors
