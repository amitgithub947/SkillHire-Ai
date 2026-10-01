import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApplicationStatusBadge } from '../../components/applications/ApplicationStatusBadge'
import { ButtonLink } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { FilterTabs, type FilterTab } from '../../components/FilterTabs'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { SkillTags } from '../../components/SkillTags'
import { useApi } from '../../hooks/useApi'
import { employerService } from '../../services/employerService'
import { APPLICATION_STATUSES, type ApplicationStatus } from '../../types/application'
import { formatDate, formatDateTime, formatExperience } from '../../utils/format'
import { APPLICATION_STATUS_LABELS } from '../../utils/labels'

type Filter = 'All' | ApplicationStatus

export default function Applications() {
  const [params, setParams] = useSearchParams()
  const jobId = Number(params.get('jobId')) || undefined

  const jobs = useApi(() => employerService.getMyJobs())
  const applications = useApi(() => employerService.getApplications({ jobId }), jobId ?? 'all')
  const [filter, setFilter] = useState<Filter>('All')
  const [search, setSearch] = useState('')

  const tabs = useMemo<FilterTab<Filter>[]>(() => {
    const list = applications.data ?? []
    return [
      { value: 'All', label: 'All', count: list.length },
      ...APPLICATION_STATUSES.map((status) => ({
        value: status,
        label: APPLICATION_STATUS_LABELS[status],
        count: list.filter((a) => a.status === status).length,
      })),
    ]
  }, [applications.data])

  const term = search.trim().toLowerCase()
  const visible = (applications.data ?? []).filter(
    (a) =>
      (filter === 'All' || a.status === filter) &&
      (term === '' ||
        a.candidateName.toLowerCase().includes(term) ||
        a.candidateEmail.toLowerCase().includes(term) ||
        a.candidateSkills.some((s) => s.toLowerCase().includes(term))),
  )

  const selectJob = (value: string) => {
    setParams(value ? { jobId: value } : {})
    setFilter('All')
  }

  return (
    <>
      <PageHeader title="Applications" subtitle="Review candidates who applied to your jobs." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="job-filter" className="text-sm font-medium text-slate-700">
            Job
          </label>
          <select
            id="job-filter"
            value={jobId ?? ''}
            onChange={(e) => selectJob(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm shadow-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100 sm:w-72"
          >
            <option value="">All jobs</option>
            {(jobs.data ?? []).map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} ({job.applicationCount})
              </option>
            ))}
          </select>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email or skill" />
      </div>

      {applications.isLoading ? (
        <LoadingState message="Loading applications…" />
      ) : applications.error ? (
        <ErrorState message={applications.error} onRetry={applications.reload} />
      ) : (
        <>
          <div className="mb-5">
            <FilterTabs tabs={tabs} value={filter} onChange={setFilter} />
          </div>

          {visible.length === 0 ? (
            <EmptyState
              title={(applications.data ?? []).length === 0 ? 'No applications yet' : 'No applications match'}
              message={
                (applications.data ?? []).length === 0
                  ? 'Once candidates apply to your approved jobs, they will appear here.'
                  : 'Try another status or search term.'
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Candidate</th>
                    <th className="hidden px-5 py-3 md:table-cell">Job</th>
                    <th className="hidden px-5 py-3 lg:table-cell">Skills</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="hidden px-5 py-3 sm:table-cell">Applied</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((a) => (
                    <tr key={a.id} className="align-top hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-brand-navy">{a.candidateName}</p>
                        <p className="text-slate-500">{a.candidateEmail}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatExperience(a.candidateExperienceYears)}
                          {a.candidateLocation && ` · ${a.candidateLocation}`}
                        </p>
                      </td>
                      <td className="hidden px-5 py-4 text-slate-700 md:table-cell">{a.jobTitle}</td>
                      <td className="hidden max-w-xs px-5 py-4 lg:table-cell">
                        {a.candidateSkills.length > 0 ? (
                          <SkillTags skills={a.candidateSkills} max={4} />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <ApplicationStatusBadge status={a.status} />
                        {a.nextInterviewAt && (
                          <p className="mt-1.5 whitespace-nowrap text-xs text-amber-700">
                            {formatDateTime(a.nextInterviewAt)}
                          </p>
                        )}
                      </td>
                      <td className="hidden whitespace-nowrap px-5 py-4 text-slate-500 sm:table-cell">
                        {formatDate(a.appliedAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <ButtonLink to={`/employer/applications/${a.id}`} variant="secondary" size="sm">
                          Review
                        </ButtonLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  )
}
