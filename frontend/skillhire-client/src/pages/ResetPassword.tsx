import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { AuthLayout } from '../components/AuthLayout'
import { FormField } from '../components/FormField'
import { SubmitButton } from '../components/SubmitButton'
import { authService } from '../services/authService'
import { parseApiError } from '../services/errors'
import { formatDateTime } from '../utils/format'
import { otpError, passwordError, withoutEmpty } from '../utils/validation'

/** Matches the server's resend cooldown, so the button isn't offered when it would do nothing. */
const RESEND_SECONDS = 60

type Step = 'code' | 'password'
type PasswordErrors = { newPassword?: string; confirmPassword?: string }

/** Steps 2 and 3 of the reset flow: check the emailed code, then choose a new password. */
export default function ResetPassword() {
  const navigate = useNavigate()
  const state = useLocation().state as { email?: string; message?: string } | null
  const email = state?.email

  const [step, setStep] = useState<Step>('code')
  const [otp, setOtp] = useState('')
  const [otpFieldError, setOtpFieldError] = useState<string | undefined>()
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null)
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' })
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({})
  const [info, setInfo] = useState(state?.message ?? null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resendIn, setResendIn] = useState(RESEND_SECONDS)

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendIn])

  // Opened directly (or after a refresh): there's no email to reset, so start over.
  if (!email) return <Navigate to="/forgot-password" replace />

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const validationError = otpError(otp)
    setOtpFieldError(validationError)
    if (validationError) return

    setIsSubmitting(true)
    try {
      const result = await authService.verifyOtp({ email, otp })
      setCodeExpiresAt(result.expiresAt)
      setInfo(null)
      setStep('password')
    } catch (err) {
      const apiError = parseApiError(err)
      setServerError(apiError.message)
      setOtpFieldError(apiError.fieldErrors.otp)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetPassword = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const validationErrors = withoutEmpty({
      newPassword: passwordError(passwords.newPassword),
      confirmPassword:
        passwords.confirmPassword === passwords.newPassword ? undefined : 'Passwords do not match.',
    })
    setPasswordErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)
    try {
      const { message } = await authService.resetPassword({ email, otp, ...passwords })
      navigate('/login', { replace: true, state: { notice: message } })
    } catch (err) {
      const apiError = parseApiError(err)
      if (apiError.fieldErrors.otp || /code/i.test(apiError.message)) {
        // The code ran out or was used meanwhile: go back to the code step.
        setStep('code')
        setOtp('')
      }
      setServerError(apiError.message)
      setPasswordErrors({
        newPassword: apiError.fieldErrors.newPassword,
        confirmPassword: apiError.fieldErrors.confirmPassword,
      })
      setIsSubmitting(false)
    }
  }

  const resendCode = async () => {
    setServerError(null)
    setResendIn(RESEND_SECONDS)
    try {
      const { message } = await authService.forgotPassword({ email })
      setInfo(`A new code is on its way. ${message}`)
      setOtp('')
    } catch (err) {
      setServerError(parseApiError(err).message)
    }
  }

  if (step === 'password') {
    return (
      <AuthLayout title="Choose a new password" subtitle={`Resetting the password for ${email}.`}>
        <form onSubmit={resetPassword} noValidate className="space-y-5">
          {serverError ? (
            <Alert variant="error">{serverError}</Alert>
          ) : (
            <Alert variant="success">
              Code verified.{codeExpiresAt && ` Finish before ${formatDateTime(codeExpiresAt)}.`}
            </Alert>
          )}

          <FormField
            label="New password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters, with a letter and a number"
            value={passwords.newPassword}
            onChange={(e) => {
              setPasswords((p) => ({ ...p, newPassword: e.target.value }))
              setPasswordErrors((p) => ({ ...p, newPassword: undefined }))
            }}
            error={passwordErrors.newPassword}
            autoFocus
          />
          <FormField
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat the new password"
            value={passwords.confirmPassword}
            onChange={(e) => {
              setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))
              setPasswordErrors((p) => ({ ...p, confirmPassword: undefined }))
            }}
            error={passwordErrors.confirmPassword}
          />

          <SubmitButton isLoading={isSubmitting} loadingText="Saving…">
            Reset password
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link to="/login" className="font-semibold text-brand-blue dark:text-blue-400 hover:underline">
            Back to log in
          </Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Check your email" subtitle={`Enter the 6-digit code we sent to ${email}.`}>
      <form onSubmit={verifyCode} noValidate className="space-y-5">
        {serverError && <Alert variant="error">{serverError}</Alert>}
        {info && !serverError && <Alert variant="info">{info}</Alert>}

        <FormField
          label="Reset code"
          name="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          className="[&_input]:text-center [&_input]:font-mono [&_input]:text-xl [&_input]:tracking-[0.5em]"
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
            setOtpFieldError(undefined)
          }}
          error={otpFieldError}
          autoFocus
        />

        <SubmitButton isLoading={isSubmitting} loadingText="Checking…">
          Verify code
        </SubmitButton>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          The code expires after 10 minutes. Can't find it? Check your spam folder.
        </p>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={resendCode}
          disabled={resendIn > 0}
          className="font-semibold text-brand-blue dark:text-blue-400 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 dark:disabled:text-slate-500 disabled:no-underline"
        >
          {resendIn > 0 ? `Send a new code in ${resendIn}s` : 'Send a new code'}
        </button>
        <Link to="/forgot-password" state={{ email }} className="font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
          Use a different email
        </Link>
      </div>
    </AuthLayout>
  )
}
