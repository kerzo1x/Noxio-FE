/** Persist access/refresh tokens from API envelopes like `{ success, data: { accessToken } }`. */
export function persistAuthTokensFromEnvelope(body: Record<string, unknown> | undefined) {
  if (!body || typeof body !== 'object') return;
  const nested =
    typeof body.data === 'object' && body.data !== null
      ? (body.data as Record<string, unknown>)
      : body;
  const access = nested.accessToken ?? nested.access_token;
  const refresh = nested.refreshToken ?? nested.refresh_token;
  if (typeof access === 'string') localStorage.setItem('access_token', access);
  if (typeof refresh === 'string') localStorage.setItem('refresh_token', refresh);
}
