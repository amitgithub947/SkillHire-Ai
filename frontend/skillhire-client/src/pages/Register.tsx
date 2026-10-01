import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { AuthLayout } from '../components/AuthLayout'
import { FormField } from '../components/FormField'
import { SubmitButton } from '../components/SubmitButton'
import { useAuth } from '../context/useAuth'
import { parseApiError } from '../services/errors'
import type { RegisterRequest, RegisterRole } from '../types/auth'
import { emailError, passwordError, withoutEmpty } from '../utils/validation'

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

  errors.email = emailError(form.email)
  errors.password = passwordError(form.password)

  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.'

  if (form.role === 'Employer' && !form.companyName.trim())
    errors.companyName = 'Company name is required for employers.'

  return withoutEmpty(errors)
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
          <legend className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">I want to join as</legend>
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
                      ? 'border-brand-blue bg-blue-50 dark:bg-blue-500/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className="block text-sm font-semibold text-brand-navy dark:text-slate-100">{option.value}</span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{option.description}</span>
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

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-blue dark:text-blue-400 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
