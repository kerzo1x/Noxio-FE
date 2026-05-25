import api from '@/api'
import type { WorkspaceMember } from '@/composables/useWorkspaceMembers'

interface MembersResponse {
  success?: boolean
  message?: string
  data?: WorkspaceMember[]
}

export function listWorkspaceMembers(workspaceId: string) {
  return api.get<MembersResponse>(`/workspaces/${workspaceId}/members`)
}
