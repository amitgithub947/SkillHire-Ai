import { useState, type ChangeEvent, type FormEvent } from 'react'
import { parseApiError } from '../../services/errors'
import type { Job, JobInput } from '../../types/job'
import { emptyToNull } from '../../utils/format'
import { Alert } from '../Alert'
import { Button } from '../Button'
import { FormField } from '../FormField'
import { TextAreaField } from '../TextAreaField'

interface JobFormValues {
  title: string
  description: string
  requirements: string
  skills: string
  location: string
  salaryMin: string
  salaryMax: string
  experienceRequired: string
}

type JobFormErrors = Partial<Record<keyof JobFormValues, string>>

interface JobFormProps {
  initialJob?: Job
  submitLabel: string
  onSubmit: (input: JobInput) => Promise<void>
  onCancel: () => void
}

function toValues(job?: Job): JobFormValues {
  return {
    title: job?.title ?? '',
    description: job?.description ?? '',
    requirements: job?.requirements ?? '',
    skills: job?.skills ?? '',
    location: job?.location ?? '',
    salaryMin: job?.salaryMin?.toString() ?? '',
    salaryMax: job?.salaryMax?.toString() ?? '',
    experienceRequired: job?.experienceRequired.toString() ?? '0',
  }
}

function toNumber(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

// Mirrors the API validation so most mistakes are caught before submitting.
function validate(values: JobFormValues): JobFormErrors {
  const errors: JobFormErrors = {}
  const title = values.title.trim()
  const description = values.description.trim()
  const requirements = values.requirements.trim()

  if (title.length < 3) errors.title = 'Title must be at least 3 characters.'
  else if (title.length > 200) errors.title = 'Title must be 200 characters or fewer.'

  if (description.length < 20) errors.description = 'Description must be at least 20 characters.'
  if (requirements.length < 10) errors.requirements = 'Requirements must be at least 10 characters.'
  if (values.skills.length > 500) errors.skills = 'Skills must be 500 characters or fewer.'

  const min = toNumber(values.salaryMin)
  const max = toNumber(values.salaryMax)
  if (min != null && (Number.isNaN(min) || min < 0)) errors.salaryMin = 'Enter a salary of 0 or more.'
  if (max != null && (Number.isNaN(max) || max < 0)) errors.salaryMax = 'Enter a salary of 0 or more.'
  if (min != null && max != null && !errors.salaryMin && !errors.salaryMax && max < min)
    errors.salaryMax = 'Maximum salary cannot be less than minimum salary.'

  const experience = Number(values.experienceRequired)
  if (values.experienceRequired.trim() === '' || !Number.isInteger(experience) || experience < 0 || experience > 50)
    errors.experienceRequired = 'Enter whole years between 0 and 50.'

  return errors
}

export function JobForm({ initialJob, submitLabel, onSubmit, onCancel }: JobFormProps) {
  const [values, setValues] = useState<JobFormValues>(() => toValues(initialJob))
  const [errors, setErrors] = useState<JobFormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const validationErrors = validate(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        requirements: values.requirements.trim(),
        skills: emptyToNull(values.skills),
        location: emptyToNull(values.location),
        salaryMin: toNumber(values.salaryMin),
        salaryMax: toNumber(values.salaryMax),
        experienceRequired: Number(values.experienceRequired),
      })
    } catch (err) {
      const apiError = parseApiError(err)
      setServerError(apiError.message)
      setErrors(apiError.fieldErrors)
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <FormField
        label="Job title"
        name="title"
        placeholder="e.g. Senior React Developer"
        value={values.title}
        onChange={handleChange}
        error={errors.title}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          label="Location"
          name="location"
          placeholder="e.g. Bengaluru or Remote"
          value={values.location}
          onChange={handleChange}
          error={errors.location}
        />
        <FormField
          label="Experience required (years)"
          name="experienceRequired"
          type="number"
          min={0}
          max={50}
          value={values.experienceRequired}
          onChange={handleChange}
          error={errors.experienceRequired}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          label="Minimum salary (optional)"
          name="salaryMin"
          type="number"
          min={0}
          placeholder="e.g. 600000"
          value={values.salaryMin}
          onChange={handleChange}
          error={errors.salaryMin}
        />
        <FormField
          label="Maximum salary (optional)"
          name="salaryMax"
          type="number"
          min={0}
          placeholder="e.g. 1200000"
          value={values.salaryMax}
          onChange={handleChange}
          error={errors.salaryMax}
        />
      </div>

      <TextAreaField
        label="Description"
        name="description"
        rows={6}
        placeholder="What will this person do? What is the team like?"
        value={values.description}
        onChange={handleChange}
        error={errors.description}
        hint="At least 20 characters."
      />

      <TextAreaField
        label="Requirements"
        name="requirements"
        rows={5}
        placeholder="Skills and qualifications, one per line. e.g. React, TypeScript, REST APIs"
        value={values.requirements}
        onChange={handleChange}
        error={errors.requirements}
        hint="Qualifications and experience you expect from candidates."
      />

      <FormField
        label="Key skills (optional)"
        name="skills"
        placeholder="e.g. React, TypeScript, REST APIs"
        value={values.skills}
        onChange={handleChange}
        error={errors.skills}
      />
      <p className="-mt-4 text-sm text-slate-500 dark:text-slate-400">
        Separate skills with commas. Candidates use these to filter jobs.
      </p>

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
