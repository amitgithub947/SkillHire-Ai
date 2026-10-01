import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { ApplicationStatusBadge } from '../../components/applications/ApplicationStatusBadge'
import { Button, ButtonLink } from '../../components/Button'
import { ErrorState } from '../../components/ErrorState'
import { FormField } from '../../components/FormField'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { SelectField } from '../../components/SelectField'
import { TextAreaField } from '../../components/TextAreaField'
import { useApi } from '../../hooks/useApi'
import { employerService } from '../../services/employerService'
import { parseApiError } from '../../services/errors'
import { INTERVIEW_TYPES, type InterviewType } from '../../types/interview'
import { canScheduleInterview } from '../../utils/applications'
import { emptyToNull, formatDateTime } from '../../utils/format'
import { INTERVIEW_TYPE_LABELS } from '../../utils/labels'

interface FormValues {
  interviewDate: string
  type: InterviewType
  meetingLink: string
  notes: string
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const URL_PATTERN = /^https?:\/\/\S+\.\S+/i

/** Current local time as "YYYY-MM-DDTHH:mm", the format a datetime-local input expects. */
function localNow(): string {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  if (!values.interviewDate) errors.interviewDate = 'Choose a date and time.'
  else if (new Date(values.interviewDate).getTime() <= Date.now())
    errors.interviewDate = 'Interview date must be in the future.'

  const link = values.meetingLink.trim()
  if (values.type === 'Online' && !link) errors.meetingLink = 'A meeting link is required for online interviews.'
  else if (link && !URL_PATTERN.test(link)) errors.meetingLink = 'Enter a full URL starting with http:// or https://.'

  if (values.notes.length > 1000) errors.notes = 'Notes must be 1000 characters or fewer.'
  return errors
}

const NOTES_PLACEHOLDER: Record<InterviewType, string> = {
  Online: 'e.g. 45 minute technical round with the engineering lead.',
  InPerson: 'Office address, floor and who to ask for at reception.',
  Phone: 'Who will call and roughly how long the call will take.',
}

export default function ScheduleInterview() {
  const { id } = useParams()
  const applicationId = Number(id)
  const navigate = useNavigate()

  const { data, error, isLoading, reload } = useApi(() => employerService.getApplication(applicationId), applicationId)
  const [minDate] = useState(localNow)
  const [values, setValues] = useState<FormValues>({ interviewDate: '', type: 'Online', meetingLink: '', notes: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (isLoading) return <LoadingState message="Loading application…" />
  if (error || !data) return <ErrorState message={error ?? 'Could not load this application.'} onRetry={reload} />

  const backTo = `/employer/applications/${data.id}`

  if (!canScheduleInterview(data)) {
    return (
      <>
        <PageHeader title="Schedule interview" subtitle={`${data.candidateName} · ${data.jobTitle}`} />
        <div className="max-w-2xl space-y-4">
          <Alert variant="info">
            {data.interviews.some((i) => i.status === 'Scheduled')
              ? 'This candidate already has a scheduled interview. Complete or cancel it before scheduling another.'
              : 'Interviews can only be scheduled for active applications.'}
          </Alert>
          <ButtonLink to={backTo} variant="secondary">
            Back to application
          </ButtonLink>
        </div>
      </>
    )
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    setIsSaving(true)
    try {
      const interview = await employerService.scheduleInterview(data.id, {
        // The input holds local time; toISOString converts it to UTC for the API.
        interviewDate: new Date(values.interviewDate).toISOString(),
        type: values.type,
        meetingLink: emptyToNull(values.meetingLink),
        notes: emptyToNull(values.notes),
      })
      navigate(backTo, {
        state: { message: `Interview scheduled for ${formatDateTime(interview.interviewDate)}. The candidate can see it now.` },
      })
    } catch (err) {
      const apiError = parseApiError(err)
      setServerError(apiError.message)
      setErrors(apiError.fieldErrors)
      setIsSaving(false)
    }
  }

  return (
    <>
      <Link to={backTo} className="mb-6 inline-block text-sm font-medium text-slate-500 hover:text-brand-blue">
        ← Back to {data.candidateName}
      </Link>
      <PageHeader title="Schedule interview" subtitle="The candidate sees these details on their interviews page." />

      <div className="grid gap-8 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2"
        >
          {serverError && <Alert variant="error">{serverError}</Alert>}

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              label="Date and time"
              name="interviewDate"
              type="datetime-local"
              min={minDate}
              value={values.interviewDate}
              onChange={handleChange}
              error={errors.interviewDate}
            />
            <SelectField
              label="Interview type"
              name="type"
              value={values.type}
              onChange={handleChange}
              options={INTERVIEW_TYPES.map((type) => ({ value: type, label: INTERVIEW_TYPE_LABELS[type] }))}
              error={errors.type}
            />
          </div>

          <FormField
            label={values.type === 'Online' ? 'Meeting link' : 'Meeting link (optional)'}
            name="meetingLink"
            type="url"
            placeholder="https://meet.google.com/…"
            value={values.meetingLink}
            onChange={handleChange}
            error={errors.meetingLink}
          />

          <TextAreaField
            label="Notes for the candidate (optional)"
            name="notes"
            rows={4}
            placeholder={NOTES_PLACEHOLDER[values.type]}
            value={values.notes}
            onChange={handleChange}
            error={errors.notes}
            hint={`${values.notes.length}/1000 characters`}
          />

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">
            <ButtonLink to={backTo} variant="secondary">
              Cancel
            </ButtonLink>
            <Button type="submit" isLoading={isSaving}>
              Schedule interview
            </Button>
          </div>
        </form>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Candidate</p>
          <p className="mt-3 font-semibold text-brand-navy">{data.candidateName}</p>
          <p className="text-sm text-slate-500">{data.candidateEmail}</p>
          {data.candidatePhone && <p className="text-sm text-slate-500">{data.candidatePhone}</p>}
          <p className="mt-4 text-sm text-slate-600">
            Applying for <span className="font-medium">{data.jobTitle}</span>
          </p>
          <div className="mt-3">
            <ApplicationStatusBadge status={data.status} />
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Scheduling moves the application to “Interview scheduled”. Times are in your local time zone.
          </p>
        </aside>
      </div>
    </>
  )
}
