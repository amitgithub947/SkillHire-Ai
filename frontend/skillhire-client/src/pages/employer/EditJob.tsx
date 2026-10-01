import { useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { ButtonLink } from '../../components/Button'
import { ErrorState } from '../../components/ErrorState'
import { JobForm } from '../../components/jobs/JobForm'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { StatusBadge } from '../../components/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { employerService } from '../../services/employerService'
import type { JobInput } from '../../types/job'

export default function EditJob() {
  const navigate = useNavigate()
  const jobId = Number(useParams().id)
  const { data: job, error, isLoading, reload } = useApi(() => employerService.getMyJob(jobId), jobId)

  if (isLoading) return <LoadingState message="Loading job…" />
  if (error || !job) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <ErrorState message={error ?? 'Job not found.'} onRetry={reload} />
        <ButtonLink to="/employer/jobs" variant="secondary">
          Back to my jobs
        </ButtonLink>
      </div>
    )
  }

  const handleSubmit = async (input: JobInput) => {
    const updated = await employerService.updateJob(job.id, input)
    const message =
      job.status === updated.status
        ? `"${updated.title}" was updated.`
        : `"${updated.title}" was updated and sent back for admin review.`
    navigate('/employer/jobs', { state: { message } })
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Edit job"
        subtitle={job.title}
        actions={<StatusBadge status={job.status} />}
      />

      {job.status === 'Closed' ? (
        <div className="space-y-4">
          <Alert variant="info">This job is closed and can no longer be edited.</Alert>
          <ButtonLink to="/employer/jobs" variant="secondary">
            Back to my jobs
          </ButtonLink>
        </div>
      ) : (
        <>
          {job.status === 'Rejected' && job.rejectionReason && (
            <div className="mb-4">
              <Alert variant="error">
                <span className="font-semibold">Rejected by admin:</span> {job.rejectionReason}
              </Alert>
            </div>
          )}
          {(job.status === 'Approved' || job.status === 'Rejected') && (
            <div className="mb-6">
              <Alert variant="info">
                Saving changes will send this job back to <strong>Pending</strong> until an admin reviews it again.
              </Alert>
            </div>
          )}
          <JobForm
            initialJob={job}
            submitLabel="Save changes"
            onSubmit={handleSubmit}
            onCancel={() => navigate('/employer/jobs')}
          />
        </>
      )}
    </div>
  )
}
