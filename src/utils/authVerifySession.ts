export const PENDING_VERIFY_EMAIL_KEY = 'user_email'

export function savePendingVerifyEmail(email: string): void {
  const trimmed = email.trim()
  if (!trimmed) return
  try {
    localStorage.setItem(PENDING_VERIFY_EMAIL_KEY, trimmed)
  } catch {
    /* ignore */
  }
}

export function getPendingVerifyEmail(): string | null {
  try {
    const value = localStorage.getItem(PENDING_VERIFY_EMAIL_KEY)
    return value?.trim() || null
  } catch {
    return null
  }
}

export function clearPendingVerifyEmail(): void {
  try {
    localStorage.removeItem(PENDING_VERIFY_EMAIL_KEY)
  } catch {
    /* ignore */
  }
}
