import type { StoredSession } from '../types/auth'

// MVP choice: the session lives in localStorage so it survives a page refresh.
// Anything that can run script on the page can read it, so later this should
// move to an httpOnly cookie issued by the API. Keeping all access in this one
// file makes that switch a local change.
const STORAGE_KEY = 'skillhire.session'

export const tokenStorage = {
  get(): StoredSession | null {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    try {
      const session = JSON.parse(raw) as StoredSession
      if (!session.token || isExpired(session.expiresAt)) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }
      return session
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
  },

  set(session: StoredSession) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY)
  },

  getToken(): string | null {
    return this.get()?.token ?? null
  },
}

export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now()
}
