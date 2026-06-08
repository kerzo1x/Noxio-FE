import api from '@/api'
import { apiBaseUrl } from '@/config/api'
import type { WorkspaceSearchResponse } from '@/types/search'

/** OpenAPI registers search at /api/api/v1/... (Elysia group prefix + route path). */
function resolveSearchBaseUrl(): string {
  const normalized = apiBaseUrl.replace(/\/$/, '')
  if (normalized.endsWith('/api/v1')) {
    return normalized.replace(/\/api\/v1$/, '/api/api/v1')
  }
  return normalized
}

export function searchWorkspace(
  workspaceId: string,
  query: string,
  signal?: AbortSignal,
) {
  return api.get<WorkspaceSearchResponse>(`/workspaces/${workspaceId}/search`, {
    baseURL: resolveSearchBaseUrl(),
    params: { query },
    signal,
  })
}