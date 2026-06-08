import api from '@/api'
import type { ApiSuccess } from '@/types/api'

export interface UserAvatarMedia {
  id: string
  fileUrl: string
}

export interface AuthUser {
  id: string
  name: string
  surname: string
  email: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  avatarMediaId: string | null
  avatar: UserAvatarMedia | null
  createdAt?: string
  updatedAt?: string
}

export function userAvatarUrl(user: AuthUser | null | undefined): string | null {
  return user?.avatar?.fileUrl ?? null
}

export function fetchMe() {
  return api.get<ApiSuccess<AuthUser>>('/auth/me')
}

export function updateProfile(body: { name?: string; surname?: string }) {
  return api.patch<ApiSuccess<AuthUser>>('/auth/me', body)
}

export function enable2fa() {
  return api.post<ApiSuccess<{ sessionToken: string }>>('/auth/2fa/enable')
}

export function disable2fa() {
  return api.delete<ApiSuccess<null>>('/auth/2fa/disable')
}

export function initiateAccountDeletion() {
  return api.delete<ApiSuccess<{ sessionToken: string }>>('/auth/me')
}

export function setUserAvatar(mediaId: string) {
  return api.patch<ApiSuccess<UserAvatarMedia>>('/auth/me/avatar', { mediaId })
}

export function removeUserAvatar() {
  return api.delete<ApiSuccess<null>>('/auth/me/avatar')
}

// TODO: backend — уточнить endpoint смены пароля (PATCH /auth/me с password или отдельный)
export function changePassword(_body: {
  newPassword: string
  confirmPassword: string
}) {
  throw new Error('Change password endpoint not implemented yet')
}
