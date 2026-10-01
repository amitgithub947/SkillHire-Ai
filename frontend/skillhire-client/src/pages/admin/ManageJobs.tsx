import { useMemo, useState } from 'react'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { FilterTabs, type FilterTab } from '../../components/FilterTabs'
import { JobDetails } from '../../components/jobs/JobDetails'
import { JobTable } from '../../components/jobs/JobTable'
import { LoadingState } from '../../components/LoadingState'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { TextAreaField } from '../../components/TextAreaField'
import { useApi } from '../../hooks/useApi'
import { adminService } from '../../services/adminService'
import { parseApiError } from '../../services/errors'
import { JOB_STATUSES, type Job, type JobStatus } from '../../types/job'

type Filter = 'All' | JobStatus

export default function ManageJobs() {
  const { data: jobs, setData: setJobs, error, isLoading, reload } = useApi(() => adminService.getJobs())
  const [filter, setFilter] = useState<Filter>('Pending')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const [viewing, setViewing] = useState<Job | null>(null)
  const [rejecting, setRejecting] = useState<Job | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyJobId, setBusyJobId] = useState<number | null>(null)

  const tabs = useMemo<FilterTab<Filter>[]>(() => {
    const list = jobs ?? []
    return [
      ...JOB_STATUSES.map((status) => ({
        value: status as Filter,
        label: status,
        count: list.filter((j) => j.status === status).length,
      })),
      { value: 'All', label: 'All jobs', count: list.length },
    ]
  }, [jobs])

  const term = search.trim().toLowerCase()
  const visibleJobs = (jobs ?? []).filter(
    (j) =>
      (filter === 'All' || j.status === filter) &&
      (!term || j.title.toLowerCase().includes(term) || j.companyName.toLowerCase().includes(term)),
  )

  const replaceJob = (updated: Job) => {
    setJobs((prev) => prev?.map((j) => (j.id === updated.id ? updated : j)) ?? null)
  }

  const approve = async (job: Job) => {
    setBusyJobId(job.id)
    setActionError(null)
    setMessage(null)
    try {
      const updated = await adminService.approveJob(job.id)
      replaceJob(updated)
      setMessage(`Approved "${updated.title}". Candidates can now see it.`)
      setViewing(null)
    } catch (err) {
      setActionError(parseApiError(err).message)
    } finally {
      setBusyJobId(null)
    }
  }

  const openReject = (job: Job) => {
    setViewing(null)
    setReason('')
    setReasonError(null)
    setActionError(null)
    setRejecting(job)
  }

  const confirmReject = async () => {
    if (!rejecting) return
    const trimmed = reason.trim()
    if (trimmed.length < 5) {
      setReasonError('Please give a reason of at least 5 characters.')
      return
    }

    setBusyJobId(rejecting.id)
    setActionError(null)
    setMessage(null)
    try {
      const updated = await adminService.rejectJob(rejecting.id, trimmed)
      replaceJob(updated)
      setMessage(`Rejected "${updated.title}". The employer can see your reason.`)
      setRejecting(null)
    } catch (err) {
      const apiError = parseApiError(err)
      setReasonError(apiError.fieldErrors.reason ?? null)
      setActionError(apiError.fieldErrors.reason ? null : apiError.message)
    } finally {
      setBusyJobId(null)
    }
  }

  return (
    <>
      <PageHeader title="Manage jobs" subtitle="Review pending jobs and browse every job on the platform." />

      {message && (
        <div className="mb-4">
          <Alert variant="success">{message}</Alert>
        </div>
      )}
      {actionError && !rejecting && (
        <div className="mb-4">
          <Alert variant="error">{actionError}</Alert>
        </div>
      )}

      {isLoading ? (
        <LoadingState message="Loading jobs…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <FilterTabs tabs={tabs} value={filter} onChange={setFilter} />
            <SearchInput value={search} onChange={setSearch} placeholder="Search title or company" />
          </div>

          {visibleJobs.length === 0 ? (
            <EmptyState
              title={filter === 'Pending' && !term ? 'No jobs waiting for review' : 'No jobs found'}
              message={term ? 'Try a different search.' : undefined}
            />
          ) : (
            <JobTable
              jobs={visibleJobs}
              showCompany
              onTitleClick={setViewing}
              renderActions={(job) =>
                job.status === 'Pending' ? (
                  <>
                    <Button size="sm" variant="success" isLoading={busyJobId === job.id} onClick={() => approve(job)}>
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="dangerOutline"
                      disabled={busyJobId === job.id}
                      onClick={() => openReject(job)}
                    >
                      Reject
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setViewing(job)}>
                    View
                  </Button>
                )
              }
            />
          )}
        </>
      )}

      {viewing && (
        <Modal
          title="Review job"
          size="lg"
          onClose={() => setViewing(null)}
          footer={
            viewing.status === 'Pending' ? (
              <>
                <Button variant="secondary" onClick={() => openReject(viewing)} disabled={busyJobId === viewing.id}>
                  Reject
                </Button>
                <Button variant="success" onClick={() => approve(viewing)} isLoading={busyJobId === viewing.id}>
                  Approve job
                </Button>
              </>
            ) : undefined
          }
        >
          <JobDetails job={viewing} />
        </Modal>
      )}

      {rejecting && (
        <Modal
          title="Reject job"
          onClose={() => busyJobId === null && setRejecting(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setRejecting(null)} disabled={busyJobId !== null}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmReject} isLoading={busyJobId === rejecting.id}>
                Reject job
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {actionError && <Alert variant="error">{actionError}</Alert>}
            <p className="text-sm text-slate-600">
              Tell <span className="font-semibold text-slate-800">{rejecting.companyName}</span> why{' '}
              <span className="font-semibold text-slate-800">{rejecting.title}</span> was rejected. They can edit the
              job and resubmit it.
            </p>
            <TextAreaField
              label="Reason"
              name="reason"
              rows={4}
              placeholder="e.g. Please add a salary range and more detail about the role."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setReasonError(null)
              }}
              error={reasonError ?? undefined}
            />
          </div>
        </Modal>
      )}
    </>
  )
}
