export interface AuthApiEnvelope<T = Record<string, unknown>> {
  success: boolean
  message?: string
  error?: string
  data: T
}

export interface LoginData {
  requires2fa: boolean
  accessToken?: string
  sessionToken?: string
}

export interface RegisterData {
  sessionToken?: string
}

export interface ForgotPasswordData {
  sessionToken?: string
}

export interface Verify2faData {
  accessToken?: string
  sessionToken?: string
}
