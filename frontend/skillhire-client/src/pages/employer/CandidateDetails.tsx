import { useState, type ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { ApplicationProgress } from '../../components/applications/ApplicationProgress'
import { ApplicationStatusBadge } from '../../components/applications/ApplicationStatusBadge'
import { Button, ButtonLink } from '../../components/Button'
import { ErrorState } from '../../components/ErrorState'
import { InterviewCard } from '../../components/interviews/InterviewCard'
import { LoadingState } from '../../components/LoadingState'
import { Modal } from '../../components/Modal'
import { SkillTags } from '../../components/SkillTags'
import { TextAreaField } from '../../components/TextAreaField'
import { useApi } from '../../hooks/useApi'
import { employerService } from '../../services/employerService'
import { ResumePreviewModal } from '../../components/ResumePreviewModal'
import { parseApiError } from '../../services/errors'
import type { Interview } from '../../types/interview'
import { canScheduleInterview } from '../../utils/applications'
import { emptyToNull, formatDateTime, formatExperience, parseSkills } from '../../utils/format'

type StatusAction = 'shortlist' | 'reject' | 'select'

const ACTION_MESSAGES: Record<StatusAction, string> = {
  shortlist: 'Candidate shortlisted.',
  select: 'Candidate selected. Congratulations on your new hire!',
  reject: 'Candidate rejected. Any scheduled interviews were cancelled.',
}

export default function CandidateDetails() {
  const { id } = useParams()
  const applicationId = Number(id)
  const location = useLocation()
  const flash = (location.state as { message?: string } | null)?.message

  const { data, setData, error, isLoading, reload } = useApi(
    () => employerService.getApplication(applicationId),
    applicationId,
  )
  const [message, setMessage] = useState<string | null>(flash ?? null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<StatusAction | null>(null)
  const [confirmReject, setConfirmReject] = useState(false)
  const [updatingInterview, setUpdatingInterview] = useState<{ interview: Interview; status: 'Completed' | 'Cancelled' } | null>(null)
  const [isPreviewingResume, setIsPreviewingResume] = useState(false)

  if (isLoading) return <LoadingState message="Loading application…" />
  if (error || !data) return <ErrorState message={error ?? 'Could not load this application.'} onRetry={reload} />

  const runAction = async (action: StatusAction) => {
    setBusyAction(action)
    setActionError(null)
    setMessage(null)
    try {
      setData(await employerService.changeApplicationStatus(data.id, action))
      setMessage(ACTION_MESSAGES[action])
      setConfirmReject(false)
    } catch (err) {
      setActionError(parseApiError(err).message)
      setConfirmReject(false)
    } finally {
      setBusyAction(null)
    }
  }

  const status = data.status
  const isFinal = status === 'Selected' || status === 'Rejected'
  const jobSkills = parseSkills(data.jobSkills)

  return (
    <>
      <Link
        to={`/employer/applications?jobId=${data.jobId}`}
        className="mb-6 inline-block text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-blue dark:hover:text-blue-400"
      >
        ← Applications for {data.jobTitle}
      </Link>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy dark:text-slate-100 sm:text-3xl">{data.candidateName}</h1>
          <p className="mt-1.5 text-slate-500 dark:text-slate-400">
            Applied for <span className="font-medium text-slate-700 dark:text-slate-200">{data.jobTitle}</span> on{' '}
            {formatDateTime(data.appliedAt)}
          </p>
        </div>
        <ApplicationStatusBadge status={status} />
      </div>

      <div className="mb-6 space-y-3">
        {message && <Alert variant="success">{message}</Alert>}
        {actionError && <Alert variant="error">{actionError}</Alert>}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-brand-navy dark:text-slate-100">Candidate profile</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <Fact label="Email">
                <a href={`mailto:${data.candidateEmail}`} className="text-brand-blue dark:text-blue-400 hover:underline">
                  {data.candidateEmail}
                </a>
              </Fact>
              <Fact label="Phone">{data.candidatePhone ?? '—'}</Fact>
              <Fact label="Location">{data.candidateLocation ?? '—'}</Fact>
              <Fact label="Experience">{formatExperience(data.candidateExperienceYears)}</Fact>
            </dl>

            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Skills</h3>
              {data.candidateSkills.length > 0 ? (
                <>
                  <SkillTags skills={data.candidateSkills} highlight={jobSkills} />
                  {jobSkills.length > 0 && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Skills that match the job are highlighted in green.</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No skills listed.</p>
              )}
            </div>

            <div className="mt-6">
              <h3 className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">Experience summary</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {data.candidateExperience ?? 'No summary provided.'}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-brand-navy dark:text-slate-100">Cover letter</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {data.coverLetter ?? 'The candidate did not include a cover letter.'}
            </p>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-navy dark:text-slate-100">Interviews</h2>
              {canScheduleInterview(data) && (
                <ButtonLink to={`/employer/applications/${data.id}/interview`} size="sm" variant="secondary">
                  Schedule interview
                </ButtonLink>
              )}
            </div>
            {data.interviews.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No interviews yet.
              </p>
            ) : (
              <div className="space-y-3">
                {data.interviews.map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    perspective="employer"
                    actions={
                      interview.status === 'Scheduled' && (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => setUpdatingInterview({ interview, status: 'Completed' })}
                          >
                            Mark completed
                          </Button>
                          <Button
                            size="sm"
                            variant="dangerOutline"
                            onClick={() => setUpdatingInterview({ interview, status: 'Cancelled' })}
                          >
                            Cancel
                          </Button>
                        </>
                      )
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-36 lg:self-start">
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="font-semibold text-brand-navy dark:text-slate-100">Hiring progress</h2>
            <div className="mt-5">
              <ApplicationProgress status={status} hadInterview={data.interviews.length > 0} />
            </div>

            {isFinal ? (
              <p className="mt-6 rounded-lg bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                This application is {status === 'Selected' ? 'complete: the candidate was selected' : 'closed: the candidate was rejected'}.
              </p>
            ) : (
              <div className="mt-6 grid gap-2">
                {status === 'Applied' && (
                  <Button variant="primary" onClick={() => runAction('shortlist')} isLoading={busyAction === 'shortlist'}>
                    Shortlist
                  </Button>
                )}
                {canScheduleInterview(data) && (
                  <ButtonLink to={`/employer/applications/${data.id}/interview`} variant="secondary">
                    Schedule interview
                  </ButtonLink>
                )}
                {(status === 'Shortlisted' || status === 'InterviewScheduled') && (
                  <Button variant="success" onClick={() => runAction('select')} isLoading={busyAction === 'select'}>
                    Select candidate
                  </Button>
                )}
                <Button variant="dangerOutline" onClick={() => setConfirmReject(true)} disabled={busyAction !== null}>
                  Reject
                </Button>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="font-semibold text-brand-navy dark:text-slate-100">Resume</h2>
            {data.resumeFileName ? (
              <>
                <p className="mt-2 break-all text-sm text-slate-600 dark:text-slate-300">{data.resumeFileName}</p>
                <Button variant="secondary" size="sm" className="mt-4" onClick={() => setIsPreviewingResume(true)}>
                  View resume
                </Button>
              </>
            ) : (
              !data.resumeUrl && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No resume file uploaded.</p>
            )}
            {data.resumeUrl && (
              <p className="mt-4 text-sm">
                <span className="text-slate-500 dark:text-slate-400">Resume link: </span>
                <a href={data.resumeUrl} target="_blank" rel="noreferrer" className="break-all font-medium text-brand-blue dark:text-blue-400 hover:underline">
                  {data.resumeUrl}
                </a>
              </p>
            )}
          </section>
        </aside>
      </div>

      {isPreviewingResume && (
        <ResumePreviewModal
          title={`${data.candidateName}'s resume`}
          load={() => employerService.downloadResume(data.id, data.resumeFileName ?? 'resume')}
          onClose={() => setIsPreviewingResume(false)}
        />
      )}

      {confirmReject && (
        <Modal
          title="Reject this candidate?"
          onClose={() => busyAction === null && setConfirmReject(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmReject(false)} disabled={busyAction !== null}>
                Keep
              </Button>
              <Button variant="danger" onClick={() => runAction('reject')} isLoading={busyAction === 'reject'}>
                Reject candidate
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {data.candidateName} will see this application as not selected. Any scheduled interview will be cancelled. This
            cannot be undone.
          </p>
        </Modal>
      )}

      {updatingInterview && (
        <InterviewOutcomeModal
          interview={updatingInterview.interview}
          status={updatingInterview.status}
          onClose={() => setUpdatingInterview(null)}
          onSaved={(updated) => {
            setUpdatingInterview(null)
            setMessage(
              updated.status === 'Completed'
                ? 'Interview marked as completed.'
                : updated.candidateNotified
                  ? `Interview cancelled. We've let ${data.candidateName} know by email.`
                  : "Interview cancelled. The email to the candidate couldn't be sent.",
            )
            reload()
          }}
        />
      )}
    </>
  )
}

interface InterviewOutcomeModalProps {
  interview: Interview
  status: 'Completed' | 'Cancelled'
  onClose: () => void
  onSaved: (updated: Interview) => void
}

function InterviewOutcomeModal({ interview, status, onClose, onSaved }: InterviewOutcomeModalProps) {
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const completing = status === 'Completed'

  const save = async () => {
    if (feedback.length > 2000) {
      setError('Feedback must be 2000 characters or fewer.')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      onSaved(await employerService.updateInterviewStatus(interview.id, { status, feedback: emptyToNull(feedback) }))
    } catch (err) {
      setError(parseApiError(err).message)
      setIsSaving(false)
    }
  }

  return (
    <Modal
      title={completing ? 'Mark interview as completed' : 'Cancel interview'}
      onClose={() => !isSaving && onClose()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Back
          </Button>
          <Button variant={completing ? 'success' : 'danger'} onClick={save} isLoading={isSaving}>
            {completing ? 'Save as completed' : 'Cancel interview'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {formatDateTime(interview.interviewDate)} with {interview.candidateName}.
          {!completing && ' The candidate gets an email. If this was the only interview, they go back to the shortlist.'}
        </p>
        <TextAreaField
          label={completing ? 'Feedback (shared with the candidate)' : 'Reason (optional)'}
          name="feedback"
          rows={5}
          placeholder={completing ? 'How did the interview go?' : 'e.g. Rescheduling due to a clash'}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          hint={`${feedback.length}/2000 characters`}
        />
      </div>
    </Modal>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 font-medium text-slate-800 dark:text-slate-100">{children}</dd>
    </div>
  )
}
