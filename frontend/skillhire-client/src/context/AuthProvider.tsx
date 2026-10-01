import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { UNAUTHORIZED_EVENT } from '../services/api'
import { authService } from '../services/authService'
import { tokenStorage } from '../services/tokenStorage'
import type { AuthResponse, LoginRequest, RegisterRequest, StoredSession } from '../types/auth'
import { AuthContext, type AuthContextValue } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  // Read the saved session synchronously so a refresh doesn't flash the login page.
  const [session, setSession] = useState<StoredSession | null>(() => tokenStorage.get())

  const logout = useCallback(() => {
    tokenStorage.clear()
    setSession(null)
  }, [])

  const saveSession = useCallback((response: AuthResponse) => {
    const next: StoredSession = {
      token: response.token,
      expiresAt: response.expiresAt,
      user: response.user,
    }
    tokenStorage.set(next)
    setSession(next)
    return response.user
  }, [])

  const login = useCallback(
    async (request: LoginRequest) => saveSession(await authService.login(request)),
    [saveSession],
  )

  const register = useCallback(
    async (request: RegisterRequest) => saveSession(await authService.register(request)),
    [saveSession],
  )

  // The API interceptor fires this when any request comes back 401.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout)
  }, [logout])

  // Log out automatically the moment the token expires.
  useEffect(() => {
    if (!session) return
    const msLeft = new Date(session.expiresAt).getTime() - Date.now()
    const timer = window.setTimeout(logout, Math.max(msLeft, 0))
    return () => window.clearTimeout(timer)
  }, [session, logout])

  // Confirm a restored token is still accepted and refresh the user details.
  const token = session?.token
  useEffect(() => {
    if (!token) return
    authService
      .me()
      .then((user) =>
        setSession((current) => {
          if (!current || current.token !== token) return current
          const next = { ...current, user }
          tokenStorage.set(next)
          return next
        }),
      )
      .catch(() => {
        // A 401 is handled by the interceptor; network errors keep the session.
      })
  }, [token])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      login,
      register,
      logout,
    }),
    [session, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
