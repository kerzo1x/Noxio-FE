import api from '@/api'
import type { WorkspaceSearchResponse } from '@/types/search'

export function searchWorkspace(
  workspaceId: string,
  query: string,
  signal?: AbortSignal,
) {
  return api.get<WorkspaceSearchResponse>(`/workspaces/${workspaceId}/search`, {
    params: { q: query },
    signal,
  })
}
