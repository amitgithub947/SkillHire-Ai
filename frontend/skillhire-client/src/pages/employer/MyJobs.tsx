import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { Button, ButtonLink } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { FilterTabs, type FilterTab } from '../../components/FilterTabs'
import { JobDetails } from '../../components/jobs/JobDetails'
import { JobTable } from '../../components/jobs/JobTable'
import { LoadingState } from '../../components/LoadingState'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { useApi } from '../../hooks/useApi'
import { employerService } from '../../services/employerService'
import { parseApiError } from '../../services/errors'
import { JOB_STATUSES, type Job, type JobStatus } from '../../types/job'

type Filter = 'All' | JobStatus

export default function MyJobs() {
  const location = useLocation()
  const flash = (location.state as { message?: string } | null)?.message

  const { data: jobs, setData: setJobs, error, isLoading, reload } = useApi(() => employerService.getMyJobs())
  const [filter, setFilter] = useState<Filter>('All')
  const [viewing, setViewing] = useState<Job | null>(null)
  const [closing, setClosing] = useState<Job | null>(null)
  const [closeError, setCloseError] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [message, setMessage] = useState<string | null>(flash ?? null)

  const tabs = useMemo<FilterTab<Filter>[]>(() => {
    const list = jobs ?? []
    return [
      { value: 'All', label: 'All', count: list.length },
      ...JOB_STATUSES.map((status) => ({
        value: status,
        label: status,
        count: list.filter((j) => j.status === status).length,
      })),
    ]
  }, [jobs])

  const visibleJobs = (jobs ?? []).filter((j) => filter === 'All' || j.status === filter)

  const confirmClose = async () => {
    if (!closing) return
    setIsClosing(true)
    setCloseError(null)
    try {
      const updated = await employerService.closeJob(closing.id)
      setJobs((prev) => prev?.map((j) => (j.id === updated.id ? updated : j)) ?? null)
      setMessage(`"${updated.title}" is now closed.`)
      setClosing(null)
    } catch (err) {
      setCloseError(parseApiError(err).message)
    } finally {
      setIsClosing(false)
    }
  }

  return (
    <>
      <PageHeader
        title="My jobs"
        subtitle="Create, edit and close your job posts."
        actions={<ButtonLink to="/employer/jobs/new">Post a job</ButtonLink>}
      />

      {message && (
        <div className="mb-6">
          <Alert variant="success">{message}</Alert>
        </div>
      )}

      {isLoading ? (
        <LoadingState message="Loading your jobs…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          <div className="mb-5">
            <FilterTabs tabs={tabs} value={filter} onChange={setFilter} />
          </div>

          {visibleJobs.length === 0 ? (
            <EmptyState
              title={filter === 'All' ? 'You have not posted any jobs yet' : `No ${filter.toLowerCase()} jobs`}
              message={filter === 'All' ? 'Post a job and an admin will review it.' : undefined}
              action={filter === 'All' ? <ButtonLink to="/employer/jobs/new">Post a job</ButtonLink> : undefined}
            />
          ) : (
            <JobTable
              jobs={visibleJobs}
              showApplicants
              onTitleClick={setViewing}
              renderActions={(job) =>
                job.status === 'Closed' ? (
                  <span className="py-1.5 text-xs text-slate-400">No actions</span>
                ) : (
                  <>
                    <ButtonLink to={`/employer/jobs/${job.id}/edit`} variant="secondary" size="sm">
                      Edit
                    </ButtonLink>
                    <Button
                      variant="dangerOutline"
                      size="sm"
                      onClick={() => {
                        setCloseError(null)
                        setClosing(job)
                      }}
                    >
                      Close
                    </Button>
                  </>
                )
              }
            />
          )}
        </>
      )}

      {viewing && (
        <Modal title="Job details" size="lg" onClose={() => setViewing(null)}>
          <JobDetails job={viewing} />
        </Modal>
      )}

      {closing && (
        <Modal
          title="Close this job?"
          onClose={() => !isClosing && setClosing(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setClosing(null)} disabled={isClosing}>
                Keep open
              </Button>
              <Button variant="danger" onClick={confirmClose} isLoading={isClosing}>
                Close job
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-sm text-slate-600">
            {closeError && <Alert variant="error">{closeError}</Alert>}
            <p>
              <span className="font-semibold text-slate-800">{closing.title}</span> will stop accepting candidates.
              Closed jobs cannot be edited or reopened.
            </p>
          </div>
        </Modal>
      )}
    </>
  )
}
