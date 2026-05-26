import { apiBaseUrl } from '@/config/api'
import { authFetch } from '@/utils/authFetch'

export async function connectEdupage(username: string, password: string) {
  const token = localStorage.getItem('access_token')
  return authFetch(`${apiBaseUrl}/integrations/edupage/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username, password }),
  })
}
