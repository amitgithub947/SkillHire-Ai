import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { AuthLayout } from '../components/AuthLayout'
import { FormField } from '../components/FormField'
import { SubmitButton } from '../components/SubmitButton'
import { useAuth } from '../context/useAuth'
import { parseApiError } from '../services/errors'
import type { LoginRequest } from '../types/auth'
import { emailError, withoutEmpty } from '../utils/validation'

type LoginErrors = Partial<Record<keyof LoginRequest, string>>

function validate(form: LoginRequest): LoginErrors {
  return withoutEmpty({
    email: emailError(form.email),
    password: form.password ? undefined : 'Password is required.',
  })
}

export default function Login() {
  const { login } = useAuth()
  // Set by the reset-password page after a successful reset.
  const notice = (useLocation().state as { notice?: string } | null)?.notice
  const [form, setForm] = useState<LoginRequest>({ email: '', password: '' })
  const [errors, setErrors] = useState<LoginErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)
    try {
      // On success the auth context updates and the route redirects by role.
      await login({ email: form.email.trim(), password: form.password })
    } catch (err) {
      const apiError = parseApiError(err)
      setServerError(apiError.message)
      setErrors(apiError.fieldErrors)
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue to SkillHire AI.">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {notice && !serverError && <Alert variant="success">{notice}</Alert>}
        {serverError && <Alert variant="error">{serverError}</Alert>}

        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          labelAction={
            <Link to="/forgot-password" className="text-sm font-medium text-brand-blue dark:text-blue-400 hover:underline">
              Forgot password?
            </Link>
          }
        />

        <SubmitButton isLoading={isSubmitting} loadingText="Logging in…">
          Log in
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        New to SkillHire AI?{' '}
        <Link to="/register" className="font-semibold text-brand-blue dark:text-blue-400 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
