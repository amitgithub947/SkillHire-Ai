import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { Button, ButtonLink } from '../../components/Button'
import { ErrorState } from '../../components/ErrorState'
import { FormField } from '../../components/FormField'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { SkillTags } from '../../components/SkillTags'
import { TextAreaField } from '../../components/TextAreaField'
import { useApi } from '../../hooks/useApi'
import { candidateService } from '../../services/candidateService'
import { parseApiError } from '../../services/errors'
import type { CandidateProfile as Profile } from '../../types/candidate'
import { emptyToNull, formatDate, formatExperience, parseSkills } from '../../utils/format'

export default function CandidateProfile() {
  const { data, setData, error, isLoading, reload } = useApi(() => candidateService.getProfile())

  if (isLoading) return <LoadingState message="Loading your profile…" />
  if (error || !data) return <ErrorState message={error ?? 'Could not load profile.'} onRetry={reload} />

  return (
    <>
      <PageHeader title="My profile" subtitle="Employers see this when you apply for their jobs." />
      <ProfileForm profile={data} onSaved={setData} />
    </>
  )
}

interface FormValues {
  phone: string
  location: string
  skills: string
  experienceYears: string
  experience: string
  resumeUrl: string
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const URL_PATTERN = /^https?:\/\/\S+\.\S+/i
const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,20}$/

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  if (values.phone.trim() && !PHONE_PATTERN.test(values.phone.trim()))
    errors.phone = 'Enter a valid phone number, e.g. +91 98765 43210.'
  if (values.skills.length > 1000) errors.skills = 'Skills must be 1000 characters or fewer.'
  const years = Number(values.experienceYears)
  if (values.experienceYears.trim() === '' || !Number.isInteger(years) || years < 0 || years > 50)
    errors.experienceYears = 'Enter whole years between 0 and 50.'
  if (values.experience.length > 3000) errors.experience = 'Keep the summary under 3000 characters.'
  if (values.resumeUrl.trim() && !URL_PATTERN.test(values.resumeUrl.trim()))
    errors.resumeUrl = 'Enter a full URL starting with http:// or https://.'
  return errors
}

function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const [values, setValues] = useState<FormValues>({
    phone: profile.phone ?? '',
    location: profile.location ?? '',
    skills: profile.skills.join(', '),
    experienceYears: String(profile.experienceYears),
    experience: profile.experience ?? '',
    resumeUrl: profile.resumeUrl ?? '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
    setSaved(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)
    setSaved(false)

    const validationErrors = validate(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsSaving(true)
    try {
      const updated = await candidateService.updateProfile({
        phone: emptyToNull(values.phone),
        location: emptyToNull(values.location),
        skills: emptyToNull(values.skills),
        experienceYears: Number(values.experienceYears),
        experience: emptyToNull(values.experience),
        resumeUrl: emptyToNull(values.resumeUrl),
      })
      onSaved(updated)
      setValues((prev) => ({ ...prev, skills: updated.skills.join(', ') }))
      setSaved(true)
    } catch (err) {
      const apiError = parseApiError(err)
      setServerError(apiError.message)
      setErrors(apiError.fieldErrors)
    } finally {
      setIsSaving(false)
    }
  }

  const skillPreview = parseSkills(values.skills)

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8 lg:col-span-2"
      >
        {saved && <Alert variant="success">Profile saved.</Alert>}
        {serverError && <Alert variant="error">{serverError}</Alert>}

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField label="Full name" name="name" value={profile.name} disabled readOnly />
          <FormField label="Email" name="email" value={profile.email} disabled readOnly />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            label="Phone"
            name="phone"
            type="tel"
            placeholder="+91 98765 43210"
            value={values.phone}
            onChange={handleChange}
            error={errors.phone}
          />
          <FormField
            label="Location"
            name="location"
            placeholder="e.g. Pune, India"
            value={values.location}
            onChange={handleChange}
            error={errors.location}
          />
        </div>

        <div>
          <FormField
            label="Skills"
            name="skills"
            placeholder="e.g. C#, React, SQL"
            value={values.skills}
            onChange={handleChange}
            error={errors.skills}
          />
          {!errors.skills && (
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Separate skills with commas.</p>
          )}
          {skillPreview.length > 0 && (
            <div className="mt-3">
              <SkillTags skills={skillPreview} />
            </div>
          )}
        </div>

        <FormField
          label="Total experience (years)"
          name="experienceYears"
          type="number"
          min={0}
          max={50}
          className="sm:max-w-xs"
          value={values.experienceYears}
          onChange={handleChange}
          error={errors.experienceYears}
        />

        <TextAreaField
          label="Experience summary"
          name="experience"
          rows={6}
          placeholder="Previous roles, key projects and achievements."
          value={values.experience}
          onChange={handleChange}
          error={errors.experience}
          hint={`${values.experience.length}/3000 characters`}
        />

        <FormField
          label="Resume link (optional)"
          name="resumeUrl"
          type="url"
          placeholder="https://drive.google.com/…"
          value={values.resumeUrl}
          onChange={handleChange}
          error={errors.resumeUrl}
        />

        <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-6">
          <Button type="submit" isLoading={isSaving}>
            Save profile
          </Button>
        </div>
      </form>

      <aside className="h-fit space-y-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Profile status</p>
          {profile.isComplete ? (
            <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">Your profile is complete.</p>
          ) : (
            <>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Complete these to stand out:</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                <Check done={Boolean(profile.phone)} label="Phone number" />
                <Check done={Boolean(profile.location)} label="Location" />
                <Check done={profile.skills.length > 0} label="Skills" />
                <Check done={profile.hasResume} label="Resume" />
              </ul>
            </>
          )}
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Experience: {formatExperience(profile.experienceYears)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Resume</p>
          {profile.resumeFileName ? (
            <p className="mt-3 break-all text-sm text-slate-700 dark:text-slate-200">
              <span className="font-medium">{profile.resumeFileName}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Uploaded {formatDate(profile.resumeUploadedAt)}</span>
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {profile.resumeUrl ? 'Using your resume link.' : 'No resume uploaded yet.'}
            </p>
          )}
          <ButtonLink to="/candidate/resume" variant="secondary" size="sm" className="mt-4">
            {profile.resumeFileName ? 'Manage resume' : 'Upload resume'}
          </ButtonLink>
        </div>

        <p className="px-1 text-xs text-slate-500 dark:text-slate-400">
          Your name and email come from your account.{' '}
          <Link to="/candidate/jobs" className="font-medium text-brand-blue dark:text-blue-400 hover:underline">
            Browse jobs
          </Link>
        </p>
      </aside>
    </div>
  )
}

function Check({ done, label }: { done: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-2 ${done ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
      <span
        aria-hidden="true"
        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
          done ? 'bg-emerald-500 text-white' : 'border border-slate-300 dark:border-slate-600'
        }`}
      >
        {done ? '✓' : ''}
      </span>
      {label}
      <span className="sr-only">{done ? '(done)' : '(missing)'}</span>
    </li>
  )
}
