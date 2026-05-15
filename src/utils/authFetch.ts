/** Auth endpoints set refreshToken in an httpOnly cookie — requests must include credentials. */
export function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, credentials: 'include' });
}
