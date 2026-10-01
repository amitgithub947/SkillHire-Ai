import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../types/auth'
import { api } from './api'

export const authService = {
  async login(request: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/login', request)
    return data
  },

  async register(request: RegisterRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/register', request)
    return data
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>('/api/auth/me')
    return data
  },
}
