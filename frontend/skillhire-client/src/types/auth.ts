export const USER_ROLES = ['Admin', 'Employer', 'Candidate'] as const
export type UserRole = (typeof USER_ROLES)[number]

/** Roles a visitor can pick on the register page. Admins are created by the system. */
export type RegisterRole = Exclude<UserRole, 'Admin'>

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
}

export interface AuthResponse {
  token: string
  expiresAt: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: RegisterRole
  companyName?: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface VerifyOtpRequest {
  email: string
  otp: string
}

export interface ResetPasswordRequest extends VerifyOtpRequest {
  newPassword: string
  confirmPassword: string
}

export interface MessageResponse {
  message: string
}

export interface VerifyOtpResponse extends MessageResponse {
  expiresAt: string
}

export interface StoredSession {
  token: string
  expiresAt: string
  user: User
}
