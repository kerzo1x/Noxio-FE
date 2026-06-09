import type { AuthApiEnvelope } from '@/types/auth'

export interface AuthTokenFields {
  accessToken?: string
  access_token?: string
}

/** Persist access token from API envelopes like `{ success, data: { accessToken } }`. */
export function persistAuthTokensFromEnvelope(
  body: AuthApiEnvelope<AuthTokenFields> | undefined,
): void {
  if (!body) return

  const nested = body.data
  const access = nested.accessToken ?? nested.access_token
  if (typeof access === 'string') localStorage.setItem('access_token', access)
}
