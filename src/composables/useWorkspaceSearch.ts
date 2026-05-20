import { ref, watch, type Ref } from 'vue'
import api from '@/api'
import type { WorkspaceSearchResponse, WorkspaceSearchResult } from '@/types/search'

const SEARCH_DEBOUNCE_MS = 300

export function useWorkspaceSearch(workspaceId: Ref<string | null>) {
  const results = ref<WorkspaceSearchResult[]>([])
  const isLoading = ref(false)
  const error = ref('')

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let abortController: AbortController | null = null
  let requestGeneration = 0

  function clearPending() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    abortController?.abort()
    abortController = null
  }

  function reset() {
    clearPending()
    results.value = []
    isLoading.value = false
    error.value = ''
  }

  async function runSearch(query: string) {
    const workspace = workspaceId.value
    const trimmed = query.trim()

    if (!workspace || !trimmed) {
      reset()
      return
    }

    clearPending()
    const generation = ++requestGeneration
    abortController = new AbortController()
    isLoading.value = true
    error.value = ''

    try {
      const response = await api.get<WorkspaceSearchResponse>(
        `/workspaces/${workspace}/search`,
        {
          params: { q: trimmed },
          signal: abortController.signal,
        },
      )

      if (generation !== requestGeneration) return

      const payload = response.data
      if (!payload?.success) {
        throw new Error(payload?.message ?? 'Search failed')
      }

      results.value = payload.data ?? []
    } catch (err) {
      if (generation !== requestGeneration) return
      if (err instanceof Error && err.name === 'CanceledError') return
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: string }).code === 'ERR_CANCELED'
      ) {
        return
      }

      console.error('Workspace search failed:', err)
      results.value = []
      error.value = 'Could not load search results.'
    } finally {
      if (generation === requestGeneration) {
        isLoading.value = false
      }
    }
  }

  function searchDebounced(query: string) {
    clearPending()

    const trimmed = query.trim()
    if (!trimmed) {
      reset()
      return
    }

    isLoading.value = true
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      void runSearch(trimmed)
    }, SEARCH_DEBOUNCE_MS)
  }

  watch(workspaceId, (id, previousId) => {
    if (id !== previousId) {
      reset()
    }
  })

  return {
    results,
    isLoading,
    error,
    searchDebounced,
    reset,
    clearPending,
  }
}
