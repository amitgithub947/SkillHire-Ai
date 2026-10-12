import axios, { type InternalAxiosRequestConfig } from 'axios'
import { serverStatus } from './serverStatus'
import { tokenStorage } from './tokenStorage'

/** Fired when the API rejects our token, so the auth context can log out. */
export const UNAUTHORIZED_EVENT = 'skillhire:unauthorized'

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:5052'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

const finishTracking = new WeakMap<InternalAxiosRequestConfig, () => void>()

function finish(config?: InternalAxiosRequestConfig) {
  if (config) {
    finishTracking.get(config)?.()
    finishTracking.delete(config)
  }
}

api.interceptors.request.use((config) => {
  const token = tokenStorage.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  finishTracking.set(config, serverStatus.track())
  return config
})

api.interceptors.response.use(
  (response) => {
    finish(response.config)
    return response
  },
  (error) => {
    finish(error.config)
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
