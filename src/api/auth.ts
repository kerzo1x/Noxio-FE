import { apiBaseUrl } from '@/config/api'
import { authFetch } from '@/utils/authFetch'
import api from '@/api'
import type {
  AuthApiEnvelope,
  ForgotPasswordData,
  LoginData,
  RegisterData,
  Verify2faData,
} from '@/types/auth'

async function authJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ response: Response; data: AuthApiEnvelope<T> }> {
  const response = await authFetch(`${apiBaseUrl}${path}`, init)
  let data: AuthApiEnvelope<T>
  try {
    data = (await response.json()) as AuthApiEnvelope<T>
  } catch {
    data = { success: false, data: {} as T }
  }
  return { response, data }
}

export function login(email: string, password: string) {
  return authJson<LoginData>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export function register(body: {
  name: string
  surname: string
  email: string
  password: string
}) {
  return authJson<RegisterData>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function resend2fa(sessionToken: string) {
  return authJson<Record<string, never>>('/auth/2fa/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken }),
  })
}

export function verify2fa(sessionToken: string, code: string) {
  return authJson<Verify2faData>('/auth/2fa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken, code }),
  })
}

export function forgotPassword(email: string) {
  return authJson<ForgotPasswordData>('/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}

export function resetPassword(body: {
  sessionToken: string
  code: string
  newPassword: string
}) {
  return authJson<Record<string, never>>('/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function logout() {
  return api.post('/auth/logout')
}
