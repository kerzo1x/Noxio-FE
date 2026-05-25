import api from '@/api'

export interface AuthUser {
  id: string
  name: string
  surname: string
  email: string
  avatar: string | null
}

export function fetchMe() {
  return api.get<{ data: AuthUser }>('/auth/me')
}
