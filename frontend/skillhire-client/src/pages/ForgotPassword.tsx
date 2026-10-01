import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { AuthLayout } from '../components/AuthLayout'
import { FormField } from '../components/FormField'
import { SubmitButton } from '../components/SubmitButton'
import { authService } from '../services/authService'
import { parseApiError } from '../services/errors'
import { emailError } from '../utils/validation'

/** Step 1 of the reset flow: ask for the email and send a code. */
export default function ForgotPassword() {
  const navigate = useNavigate()
  // Coming back from the next step with "Use a different email" keeps what was typed.
  const initialEmail = (useLocation().state as { email?: string } | null)?.email ?? ''
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState<string | undefined>()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const validationError = emailError(email)
    setError(validationError)
    if (validationError) return

    setIsSubmitting(true)
    try {
      const { message } = await authService.forgotPassword({ email: email.trim() })
      navigate('/reset-password', { state: { email: email.trim(), message } })
    } catch (err) {
      const apiError = parseApiError(err)
      setServerError(apiError.message)
      setError(apiError.fieldErrors.email)
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter the email you use for SkillHire AI and we'll send you a 6-digit code to reset it."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {serverError && <Alert variant="error">{serverError}</Alert>}

        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(undefined)
          }}
          error={error}
          autoFocus
        />

        <SubmitButton isLoading={isSubmitting} loadingText="Sending code…">
          Send reset code
        </SubmitButton>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Password reset is available for employer and candidate accounts.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-brand-blue dark:text-blue-400 hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  )
}
