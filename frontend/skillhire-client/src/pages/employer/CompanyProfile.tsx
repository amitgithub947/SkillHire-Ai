import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { CompanyLogo } from '../../components/CompanyLogo'
import { ErrorState } from '../../components/ErrorState'
import { FormField } from '../../components/FormField'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { TextAreaField } from '../../components/TextAreaField'
import { useApi } from '../../hooks/useApi'
import { employerService } from '../../services/employerService'
import { parseApiError } from '../../services/errors'
import type { EmployerProfile } from '../../types/employer'
import { emptyToNull } from '../../utils/format'

export default function CompanyProfile() {
  const { data, setData, error, isLoading, reload } = useApi(() => employerService.getProfile())

  if (isLoading) return <LoadingState message="Loading company profile…" />
  if (error || !data) return <ErrorState message={error ?? 'Could not load profile.'} onRetry={reload} />

  return (
    <>
      <PageHeader title="Company profile" subtitle="This is what candidates see about your company." />
      <ProfileForm profile={data} onSaved={setData} />
    </>
  )
}

interface ProfileFormValues {
  companyName: string
  companyDescription: string
  location: string
  website: string
  logoUrl: string
}

type ProfileErrors = Partial<Record<keyof ProfileFormValues, string>>

const URL_PATTERN = /^https?:\/\/\S+\.\S+/i

function validate(values: ProfileFormValues): ProfileErrors {
  const errors: ProfileErrors = {}
  const name = values.companyName.trim()
  if (name.length < 2) errors.companyName = 'Company name must be at least 2 characters.'
  if (values.companyDescription.length > 2000) errors.companyDescription = 'Keep the description under 2000 characters.'
  if (values.website.trim() && !URL_PATTERN.test(values.website.trim()))
    errors.website = 'Enter a full URL starting with http:// or https://.'
  if (values.logoUrl.trim() && !URL_PATTERN.test(values.logoUrl.trim()))
    errors.logoUrl = 'Enter a full URL starting with http:// or https://.'
  return errors
}

function ProfileForm({ profile, onSaved }: { profile: EmployerProfile; onSaved: (p: EmployerProfile) => void }) {
  const [values, setValues] = useState<ProfileFormValues>({
    companyName: profile.companyName,
    companyDescription: profile.companyDescription ?? '',
    location: profile.location ?? '',
    website: profile.website ?? '',
    logoUrl: profile.logoUrl ?? '',
  })
  const [errors, setErrors] = useState<ProfileErrors>({})
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
      const updated = await employerService.updateProfile({
        companyName: values.companyName.trim(),
        companyDescription: emptyToNull(values.companyDescription),
        location: emptyToNull(values.location),
        website: emptyToNull(values.website),
        logoUrl: emptyToNull(values.logoUrl),
      })
      onSaved(updated)
      setSaved(true)
    } catch (err) {
      const apiError = parseApiError(err)
      setServerError(apiError.message)
      setErrors(apiError.fieldErrors)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8 lg:col-span-2"
      >
        {saved && <Alert variant="success">Company profile saved.</Alert>}
        {serverError && <Alert variant="error">{serverError}</Alert>}

        <FormField
          label="Company name"
          name="companyName"
          value={values.companyName}
          onChange={handleChange}
          error={errors.companyName}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            label="Location"
            name="location"
            placeholder="e.g. Pune, India"
            value={values.location}
            onChange={handleChange}
            error={errors.location}
          />
          <FormField
            label="Website"
            name="website"
            type="url"
            placeholder="https://example.com"
            value={values.website}
            onChange={handleChange}
            error={errors.website}
          />
        </div>

        <FormField
          label="Logo URL"
          name="logoUrl"
          type="url"
          placeholder="https://example.com/logo.png"
          value={values.logoUrl}
          onChange={handleChange}
          error={errors.logoUrl}
        />

        <TextAreaField
          label="About the company"
          name="companyDescription"
          rows={6}
          placeholder="What does your company do? What is it like to work there?"
          value={values.companyDescription}
          onChange={handleChange}
          error={errors.companyDescription}
          hint={`${values.companyDescription.length}/2000 characters`}
        />

        <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-6">
          <Button type="submit" isLoading={isSaving}>
            Save profile
          </Button>
        </div>
      </form>

      <aside className="h-fit rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Preview</p>
        <div className="mt-4 flex items-center gap-4">
          <CompanyLogo name={values.companyName || 'Company'} logoUrl={emptyToNull(values.logoUrl)} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-brand-navy dark:text-slate-100">{values.companyName || 'Company name'}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{values.location || 'Location'}</p>
          </div>
        </div>
        {values.website && (
          <p className="mt-4 truncate text-sm text-brand-blue dark:text-blue-400">{values.website}</p>
        )}
        <p className="mt-4 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">
          {values.companyDescription || 'Add a short description of your company.'}
        </p>
        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-sm text-slate-500 dark:text-slate-400">
          <p>
            Contact: <span className="font-medium text-slate-700 dark:text-slate-200">{profile.contactName}</span>
          </p>
          <p>{profile.contactEmail}</p>
        </div>
      </aside>
    </div>
  )
}
