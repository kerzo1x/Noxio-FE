import { computed, ref } from 'vue'
import api from '@/api'

export type WorkspaceMemberRole = 'VIEWER' | 'EDITOR' | 'ADMIN'

export interface WorkspaceMemberUser {
  id: string
  name: string
  surname: string
  email: string
  avatarMediaId: string | null
}

export interface WorkspaceMember {
  id: string
  workspaceId: string
  role: WorkspaceMemberRole
  joinedAt: string
  user: WorkspaceMemberUser
}

interface MembersResponse {
  success?: boolean
  message?: string
  data?: WorkspaceMember[]
}

export function useWorkspaceMembers() {
  const members = ref<WorkspaceMember[]>([])
  const isLoading = ref(false)
  const loadError = ref('')
  const searchQuery = ref('')
  const loadedWorkspaceId = ref<string | null>(null)

  const filteredMembers = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return members.value

    return members.value.filter((member) => {
      const { name, surname, email } = member.user
      const fullName = `${name} ${surname}`.trim().toLowerCase()
      return (
        fullName.includes(query) ||
        name.toLowerCase().includes(query) ||
        surname.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query)
      )
    })
  })

  function memberDisplayName(member: WorkspaceMember): string {
    return `${member.user.name} ${member.user.surname}`.trim()
  }

  function memberRoleLabel(member: WorkspaceMember, ownerId: string): string {
    if (ownerId && member.user.id === ownerId) return 'Owner'

    const labels: Record<WorkspaceMemberRole, string> = {
      ADMIN: 'Admin',
      EDITOR: 'Editor',
      VIEWER: 'Viewer',
    }
    return labels[member.role] ?? member.role
  }

  function resetSearch() {
    searchQuery.value = ''
  }

  function invalidateCache() {
    members.value = []
    loadError.value = ''
    isLoading.value = false
    loadedWorkspaceId.value = null
  }

  function reset() {
    resetSearch()
    invalidateCache()
  }

  async function fetchMembers(workspaceId: string, force = false) {
    if (
      !force &&
      loadedWorkspaceId.value === workspaceId &&
      !loadError.value
    ) {
      return
    }

    isLoading.value = true
    loadError.value = ''

    try {
      const response = await api.get<MembersResponse>(
        `/workspaces/${workspaceId}/members`,
      )
      const payload = response.data

      if (!payload?.success) {
        throw new Error(payload?.message || 'Failed to load workspace members')
      }

      members.value = payload.data ?? []
      loadedWorkspaceId.value = workspaceId
    } catch (error) {
      console.error('Failed to fetch workspace members:', error)
      members.value = []
      loadedWorkspaceId.value = null
      loadError.value =
        error instanceof Error ? error.message : 'Failed to load members'
    } finally {
      isLoading.value = false
    }
  }

  return {
    members,
    isLoading,
    loadError,
    searchQuery,
    loadedWorkspaceId,
    filteredMembers,
    memberDisplayName,
    memberRoleLabel,
    resetSearch,
    invalidateCache,
    reset,
    fetchMembers,
  }
}
