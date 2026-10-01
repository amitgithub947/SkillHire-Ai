import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { ApplicationProgress } from '../../components/applications/ApplicationProgress'
import { ApplicationStatusBadge } from '../../components/applications/ApplicationStatusBadge'
import { Button, ButtonLink } from '../../components/Button'
import { CompanyLogo } from '../../components/CompanyLogo'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { FilterTabs, type FilterTab } from '../../components/FilterTabs'
import { InterviewCard } from '../../components/interviews/InterviewCard'
import { LoadingState } from '../../components/LoadingState'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { TextAreaField } from '../../components/TextAreaField'
import { useApi } from '../../hooks/useApi'
import { candidateService } from '../../services/candidateService'
import { parseApiError } from '../../services/errors'
import { APPLICATION_STATUSES, type ApplicationStatus, type CandidateApplication } from '../../types/application'
import { emptyToNull, formatDate, formatDateTime } from '../../utils/format'
import { APPLICATION_STATUS_LABELS } from '../../utils/labels'

type Filter = 'All' | ApplicationStatus

const STATUS_HELP: Record<ApplicationStatus, string> = {
  Applied: 'The employer has not reviewed your application yet.',
  Shortlisted: 'Good news: you are on the shortlist. The employer may contact you for an interview.',
  InterviewScheduled: 'You have an interview. Check the details below.',
  Selected: 'Congratulations! The employer has selected you for this role.',
  Rejected: 'The employer decided not to move forward this time. Keep applying!',
}

export default function MyApplications() {
  const { data, setData, error, isLoading, reload } = useApi(() => candidateService.getApplications())
  const [filter, setFilter] = useState<Filter>('All')
  const [viewing, setViewing] = useState<CandidateApplication | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const tabs = useMemo<FilterTab<Filter>[]>(() => {
    const list = data ?? []
    return [
      { value: 'All', label: 'All', count: list.length },
      ...APPLICATION_STATUSES.map((status) => ({
        value: status,
        label: APPLICATION_STATUS_LABELS[status],
        count: list.filter((a) => a.status === status).length,
      })),
    ]
  }, [data])

  const visible = (data ?? []).filter((a) => filter === 'All' || a.status === filter)

  const replace = (updated: CandidateApplication) => {
    setData((prev) => prev?.map((a) => (a.id === updated.id ? updated : a)) ?? null)
    setViewing(updated)
  }

  const removed = (application: CandidateApplication) => {
    setData((prev) => prev?.filter((a) => a.id !== application.id) ?? null)
    setViewing(null)
    setMessage(`Your application for "${application.jobTitle}" was withdrawn.`)
  }

  return (
    <>
      <PageHeader
        title="My applications"
        subtitle="Track every job you have applied for."
        actions={<ButtonLink to="/candidate/jobs">Find more jobs</ButtonLink>}
      />

      {message && (
        <div className="mb-6">
          <Alert variant="success">{message}</Alert>
        </div>
      )}

      {isLoading ? (
        <LoadingState message="Loading your applications…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          <div className="mb-5">
            <FilterTabs tabs={tabs} value={filter} onChange={setFilter} />
          </div>

          {visible.length === 0 ? (
            <EmptyState
              title={filter === 'All' ? 'No applications yet' : `No applications with status "${APPLICATION_STATUS_LABELS[filter]}"`}
              message={filter === 'All' ? 'Find a job you like and apply. It will show up here.' : undefined}
              action={filter === 'All' ? <ButtonLink to="/candidate/jobs">Browse jobs</ButtonLink> : undefined}
            />
          ) : (
            <div className="space-y-4">
              {visible.map((application) => (
                <ApplicationCard key={application.id} application={application} onView={() => setViewing(application)} />
              ))}
            </div>
          )}
        </>
      )}

      {viewing && (
        <ApplicationModal
          application={viewing}
          onClose={() => setViewing(null)}
          onUpdated={replace}
          onWithdrawn={removed}
        />
      )}
    </>
  )
}

function ApplicationCard({ application, onView }: { application: CandidateApplication; onView: () => void }) {
  const next = application.interviews.find((i) => i.status === 'Scheduled')

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start gap-4">
        <CompanyLogo name={application.companyName} logoUrl={application.companyLogoUrl} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-brand-navy">{application.jobTitle}</h3>
          <p className="text-sm text-slate-500">
            {application.companyName}
            {application.jobLocation && ` · ${application.jobLocation}`}
          </p>
          <p className="mt-1 text-xs text-slate-400">Applied {formatDate(application.appliedAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <ApplicationStatusBadge status={application.status} />
          <Button variant="secondary" size="sm" onClick={onView}>
            Details
          </Button>
        </div>
      </div>

      <div className="mt-6 max-w-xl">
        <ApplicationProgress status={application.status} hadInterview={application.interviews.length > 0} />
      </div>

      {next && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">Interview:</span> {formatDateTime(next.interviewDate)}
          {next.meetingLink && (
            <>
              {' · '}
              <a href={next.meetingLink} target="_blank" rel="noreferrer" className="font-semibold underline">
                Join link
              </a>
            </>
          )}
        </div>
      )}
    </article>
  )
}

interface ApplicationModalProps {
  application: CandidateApplication
  onClose: () => void
  onUpdated: (application: CandidateApplication) => void
  onWithdrawn: (application: CandidateApplication) => void
}

function ApplicationModal({ application, onClose, onUpdated, onWithdrawn }: ApplicationModalProps) {
  const canChange = application.status === 'Applied'
  const [isEditing, setIsEditing] = useState(false)
  const [coverLetter, setCoverLetter] = useState(application.coverLetter ?? '')
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (coverLetter.length > 3000) {
      setError('Cover letter must be 3000 characters or fewer.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      onUpdated(await candidateService.updateApplication(application.id, emptyToNull(coverLetter)))
      setIsEditing(false)
    } catch (err) {
      setError(parseApiError(err).message)
    } finally {
      setBusy(false)
    }
  }

  const withdraw = async () => {
    setBusy(true)
    setError(null)
    try {
      await candidateService.withdrawApplication(application.id)
      onWithdrawn(application)
    } catch (err) {
      setError(parseApiError(err).message)
      setConfirmWithdraw(false)
    } finally {
      setBusy(false)
    }
  }

  const footer = confirmWithdraw ? (
    <>
      <span className="mr-auto self-center text-sm text-slate-600">Withdraw this application?</span>
      <Button variant="secondary" onClick={() => setConfirmWithdraw(false)} disabled={busy}>
        Keep it
      </Button>
      <Button variant="danger" onClick={withdraw} isLoading={busy}>
        Withdraw
      </Button>
    </>
  ) : isEditing ? (
    <>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={() => {
          setIsEditing(false)
          setCoverLetter(application.coverLetter ?? '')
        }}
      >
        Cancel
      </Button>
      <Button onClick={save} isLoading={busy}>
        Save cover letter
      </Button>
    </>
  ) : (
    <>
      {canChange && (
        <Button variant="dangerOutline" className="mr-auto" onClick={() => setConfirmWithdraw(true)}>
          Withdraw
        </Button>
      )}
      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
    </>
  )

  return (
    <Modal title={application.jobTitle} onClose={onClose} size="lg" footer={footer}>
      <div className="space-y-6">
        {error && <Alert variant="error">{error}</Alert>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-slate-700">{application.companyName}</p>
            <p className="text-sm text-slate-500">Applied {formatDateTime(application.appliedAt)}</p>
          </div>
          <ApplicationStatusBadge status={application.status} />
        </div>

        <ApplicationProgress status={application.status} hadInterview={application.interviews.length > 0} />
        <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">{STATUS_HELP[application.status]}</p>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">Cover letter</h4>
            {canChange && !isEditing && !confirmWithdraw && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-sm font-semibold text-brand-blue hover:underline"
              >
                Edit
              </button>
            )}
          </div>
          {isEditing ? (
            <TextAreaField
              label="Cover letter"
              name="coverLetter"
              rows={7}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              hint={`${coverLetter.length}/3000 characters`}
            />
          ) : (
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {application.coverLetter ?? 'No cover letter was included.'}
            </p>
          )}
          {!canChange && (
            <p className="mt-2 text-xs text-slate-500">
              The employer has reviewed this application, so it can no longer be edited or withdrawn.
            </p>
          )}
        </div>

        {application.interviews.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-700">Interviews</h4>
            <div className="space-y-3">
              {application.interviews.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} perspective="candidate" />
              ))}
            </div>
          </div>
        )}

        {application.jobStatus === 'Approved' && (
          <Link
            to={`/candidate/jobs/${application.jobId}`}
            className="inline-block text-sm font-semibold text-brand-blue hover:underline"
          >
            View job posting →
          </Link>
        )}
      </div>
    </Modal>
  )
}
