import axios from 'axios'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { ApplicationProgress } from '../../components/applications/ApplicationProgress'
import { ApplicationStatusBadge } from '../../components/applications/ApplicationStatusBadge'
import { Button, ButtonLink } from '../../components/Button'
import { CompanyLogo } from '../../components/CompanyLogo'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { SkillTags } from '../../components/SkillTags'
import { TextAreaField } from '../../components/TextAreaField'
import { useApi } from '../../hooks/useApi'
import { candidateService } from '../../services/candidateService'
import { parseApiError } from '../../services/errors'
import type { CandidateProfile } from '../../types/candidate'
import type { JobListingDetails } from '../../types/job'
import { emptyToNull, formatDate, formatExperience, formatSalary } from '../../utils/format'

const COVER_LETTER_MAX = 3000

export default function JobDetails() {
  const { id } = useParams()
  const jobId = Number(id)
  const navigate = useNavigate()

  const job = useApi(() => candidateService.getJob(jobId), jobId)
  const profile = useApi(() => candidateService.getProfile())

  if (job.isLoading || profile.isLoading) return <LoadingState message="Loading job…" />
  if (job.error || !job.data) {
    return <ErrorState message={job.error ?? 'Could not load this job.'} onRetry={job.reload} />
  }

  const data = job.data

  return (
    <>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 text-sm font-medium text-slate-500 hover:text-brand-blue"
      >
        ← Back to jobs
      </button>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <CompanyLogo name={data.companyName} logoUrl={data.companyLogoUrl} size="lg" />
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-brand-navy">{data.title}</h1>
                <p className="mt-1 text-slate-500">{data.companyName}</p>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-4">
              <Fact label="Location" value={data.location ?? '—'} />
              <Fact label="Salary" value={formatSalary(data.salaryMin, data.salaryMax)} />
              <Fact label="Experience" value={formatExperience(data.experienceRequired)} />
              <Fact label="Posted" value={formatDate(data.postedAt)} />
            </dl>

            {data.skills.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-semibold text-slate-700">Key skills</h2>
                <SkillTags skills={data.skills} highlight={profile.data?.skills} />
                {profile.data && profile.data.skills.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500">Skills you have are highlighted in green.</p>
                )}
              </div>
            )}

            <Section title="Job description" text={data.description} />
            <Section title="Requirements" text={data.requirements} />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-brand-navy">About {data.companyName}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {data.companyDescription ?? 'This company has not added a description yet.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {data.companyLocation && <span className="text-slate-600">{data.companyLocation}</span>}
              {data.companyWebsite && (
                <a
                  href={data.companyWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-brand-blue hover:underline"
                >
                  {data.companyWebsite}
                </a>
              )}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-36 lg:self-start">
          <ApplyPanel job={data} profile={profile.data} onApplied={job.setData} onConflict={job.reload} />
        </aside>
      </div>
    </>
  )
}

interface ApplyPanelProps {
  job: JobListingDetails
  profile: CandidateProfile | null
  onApplied: (job: JobListingDetails) => void
  onConflict: () => void
}

function ApplyPanel({ job, profile, onApplied, onConflict }: ApplyPanelProps) {
  const [coverLetter, setCoverLetter] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [justApplied, setJustApplied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const card = 'rounded-xl border border-slate-200 bg-white p-6 shadow-sm'

  if (job.applicationStatus) {
    return (
      <div className={card}>
        {justApplied && (
          <div className="mb-4">
            <Alert variant="success">Application sent! The employer will review it soon.</Alert>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-brand-navy">Your application</h2>
          <ApplicationStatusBadge status={job.applicationStatus} />
        </div>
        <div className="mt-5">
          <ApplicationProgress status={job.applicationStatus} />
        </div>
        <ButtonLink to="/candidate/applications" variant="secondary" className="mt-6 w-full">
          View my applications
        </ButtonLink>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (coverLetter.length > COVER_LETTER_MAX) {
      setError(`Cover letter must be ${COVER_LETTER_MAX} characters or fewer.`)
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const application = await candidateService.apply(job.id, emptyToNull(coverLetter))
      setJustApplied(true)
      onApplied({ ...job, applicationId: application.id, applicationStatus: application.status })
    } catch (err) {
      const apiError = parseApiError(err)
      setError(apiError.fieldErrors.coverLetter ?? apiError.message)
      // Already applied in another tab, or the job just closed: refresh to show the real state.
      if (axios.isAxiosError(err) && err.response?.status === 409) onConflict()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (profile && !profile.hasResume) {
    return (
      <div className={card}>
        <h2 className="font-semibold text-brand-navy">Apply for this job</h2>
        <p className="mt-2 text-sm text-slate-600">
          Employers need to see your resume. Upload one (or add a resume link) before applying.
        </p>
        <ButtonLink to="/candidate/resume" className="mt-5 w-full">
          Upload resume
        </ButtonLink>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={card}>
      <h2 className="font-semibold text-brand-navy">Apply for this job</h2>
      <p className="mt-1 text-sm text-slate-500">
        Your profile and resume{profile?.resumeFileName ? ` (${profile.resumeFileName})` : ''} will be shared with{' '}
        {job.companyName}.
      </p>

      {error && (
        <div className="mt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <TextAreaField
        className="mt-5"
        label="Cover letter (optional)"
        name="coverLetter"
        rows={7}
        placeholder="Why are you a good fit for this role?"
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        hint={`${coverLetter.length}/${COVER_LETTER_MAX} characters`}
      />

      <Button type="submit" isLoading={isSubmitting} className="mt-5 w-full">
        Apply now
      </Button>
      {profile && !profile.isComplete && (
        <p className="mt-3 text-xs text-slate-500">
          Tip: a complete{' '}
          <Link to="/candidate/profile" className="font-medium text-brand-blue hover:underline">
            profile
          </Link>{' '}
          makes a better first impression.
        </p>
      )}
    </form>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-slate-800">{value}</dd>
    </div>
  )
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">{text}</p>
    </div>
  )
}
