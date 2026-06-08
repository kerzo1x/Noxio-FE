import api from '@/api'
import type { ApiSuccess } from '@/types/api'
import type { WorkspaceMemberRole } from '@/composables/useWorkspaceMembers'

export interface Workspace {
  id: string
  name: string
  ownerId: string
  role: string
  memberCount: number
  createdAt: string
  updatedAt: string
}

export function listWorkspaces() {
  return api.get<ApiSuccess<Workspace[]>>('/workspaces')
}

export function createWorkspace(name: string) {
  return api.post<ApiSuccess<Workspace>>('/workspaces', { name })
}

export function createInvitation(
  workspaceId: string,
  email: string,
  role: WorkspaceMemberRole,
) {
  return api.post(`/workspaces/${workspaceId}/invitations`, { email, role })
}

export function updateWorkspace(workspaceId: string, body: { name: string }) {
  return api.patch<ApiSuccess<Workspace>>(`/workspaces/${workspaceId}`, body)
}

export function updateMemberRole(
  workspaceId: string,
  memberId: string,
  role: WorkspaceMemberRole,
) {
  return api.patch(`/workspaces/${workspaceId}/members/${memberId}`, { role })
}
