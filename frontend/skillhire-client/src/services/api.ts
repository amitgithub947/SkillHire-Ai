import axios from 'axios'
import { tokenStorage } from './tokenStorage'

/** Fired when the API rejects our token, so the auth context can log out. */
export const UNAUTHORIZED_EVENT = 'skillhire:unauthorized'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5052',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = tokenStorage.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.startsWith('/api/auth/login') ||
      error.config?.url?.startsWith('/api/auth/register')

    // A 401 on login just means wrong credentials; anywhere else the token is bad.
    if (error.response?.status === 401 && !isAuthRequest) {
      tokenStorage.clear()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    return Promise.reject(error)
  },
)
