import type {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest,
  User,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '../types/auth'
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

  /** Emails a reset code. The answer is the same whether or not the account exists. */
  async forgotPassword(request: ForgotPasswordRequest): Promise<MessageResponse> {
    const { data } = await api.post<MessageResponse>('/api/auth/forgot-password', request)
    return data
  },

  async verifyOtp(request: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const { data } = await api.post<VerifyOtpResponse>('/api/auth/verify-otp', request)
    return data
  },

  async resetPassword(request: ResetPasswordRequest): Promise<MessageResponse> {
    const { data } = await api.post<MessageResponse>('/api/auth/reset-password', request)
    return data
  },
}
