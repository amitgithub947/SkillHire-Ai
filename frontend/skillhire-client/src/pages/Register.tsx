import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { AuthLayout } from '../components/AuthLayout'
import { FormField } from '../components/FormField'
import { SubmitButton } from '../components/SubmitButton'
import { useAuth } from '../context/useAuth'
import { parseApiError } from '../services/errors'
import type { RegisterRequest, RegisterRole } from '../types/auth'

type RegisterForm = Required<RegisterRequest>
type RegisterErrors = Partial<Record<keyof RegisterForm, string>>

const ROLE_OPTIONS: { value: RegisterRole; description: string }[] = [
  { value: 'Candidate', description: 'Find jobs and track applications' },
  { value: 'Employer', description: 'Post jobs and review candidates' },
]

// Mirrors the API rules so users see problems before submitting.
function validate(form: RegisterForm): RegisterErrors {
  const errors: RegisterErrors = {}
  const name = form.name.trim()

  if (!name) errors.name = 'Name is required.'
  else if (name.length < 2) errors.name = 'Name must be at least 2 characters.'

  if (!form.email.trim()) errors.email = 'Email is required.'
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address.'

  if (form.password.length < 8) errors.password = 'Password must be at least 8 characters long.'
  else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
    errors.password = 'Password must contain at least one letter and one number.'

  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.'

  if (form.role === 'Employer' && !form.companyName.trim())
    errors.companyName = 'Company name is required for employers.'

  return errors
}

export default function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Candidate',
    companyName: '',
  })
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const selectRole = (role: RegisterRole) => {
    setForm((prev) => ({ ...prev, role }))
    setErrors((prev) => ({ ...prev, companyName: undefined }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
        companyName: form.role === 'Employer' ? form.companyName.trim() : undefined,
      })
    } catch (err) {
      const apiError = parseApiError(err)
      setServerError(apiError.message)
      setErrors(apiError.fieldErrors)
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join SkillHire AI in less than a minute.">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {serverError && <Alert variant="error">{serverError}</Alert>}

        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-slate-700">I want to join as</legend>
          <div className="grid grid-cols-2 gap-3">
            {ROLE_OPTIONS.map((option) => {
              const selected = form.role === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectRole(option.value)}
                  className={`rounded-lg border-2 p-3 text-left transition ${
                    selected
                      ? 'border-brand-blue bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="block text-sm font-semibold text-brand-navy">{option.value}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{option.description}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <FormField
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Jane Doe"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
        />

        {form.role === 'Employer' && (
          <FormField
            label="Company name"
            name="companyName"
            autoComplete="organization"
            placeholder="Acme Corp"
            value={form.companyName}
            onChange={handleChange}
            error={errors.companyName}
          />
        )}

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

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
          <FormField
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />
        </div>

        <SubmitButton isLoading={isSubmitting} loadingText="Creating account…">
          Create account
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-blue hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
