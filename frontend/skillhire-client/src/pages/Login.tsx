import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { AuthLayout } from '../components/AuthLayout'
import { FormField } from '../components/FormField'
import { SubmitButton } from '../components/SubmitButton'
import { useAuth } from '../context/useAuth'
import { parseApiError } from '../services/errors'
import type { LoginRequest } from '../types/auth'

type LoginErrors = Partial<Record<keyof LoginRequest, string>>

function validate(form: LoginRequest): LoginErrors {
  const errors: LoginErrors = {}
  if (!form.email.trim()) errors.email = 'Email is required.'
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address.'
  if (!form.password) errors.password = 'Password is required.'
  return errors
}

export default function Login() {
  const { login } = useAuth()
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
        />

        <SubmitButton isLoading={isSubmitting} loadingText="Logging in…">
          Log in
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        New to SkillHire AI?{' '}
        <Link to="/register" className="font-semibold text-brand-blue hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
