// These mirror the API rules so users see problems before submitting.

/** Drops fields without an error, so `Object.keys(errors).length` means "has errors". */
export function withoutEmpty<T extends Record<string, string | undefined>>(errors: T): Partial<T> {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as Partial<T>
}

export function emailError(email: string): string | undefined {
  if (!email.trim()) return 'Email is required.'
  if (!/^\S+@\S+\.\S+$/.test(email)) return 'Enter a valid email address.'
  return undefined
}

export function passwordError(password: string): string | undefined {
  if (password.length < 8) return 'Password must be at least 8 characters long.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    return 'Password must contain at least one letter and one number.'
  return undefined
}

export function otpError(otp: string): string | undefined {
  if (!otp) return 'Enter the 6-digit code from the email.'
  if (!/^\d{6}$/.test(otp)) return 'The code must be exactly 6 digits.'
  return undefined
}
