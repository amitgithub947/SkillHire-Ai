import { Link } from 'react-router-dom'
import { ButtonLink } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { Icon } from '../../components/Icon'
import { JobTable } from '../../components/jobs/JobTable'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { StatCard } from '../../components/StatCard'
import { StatusBreakdown } from '../../components/StatusBreakdown'
import { useApi } from '../../hooks/useApi'
import { adminService } from '../../services/adminService'

export default function AdminDashboard() {
  const { data, error, isLoading, reload } = useApi(() => adminService.getDashboard())

  if (isLoading) return <LoadingState message="Loading platform overview…" />
  if (error || !data) return <ErrorState message={error ?? 'Could not load dashboard.'} onRetry={reload} />

  const { users, jobs } = data

  return (
    <>
      <PageHeader
        eyebrow="Admin console"
        title="Platform overview"
        subtitle="Accounts on SkillHire AI and the jobs waiting for your review."
        actions={
          <>
            <ButtonLink to="/admin/users" variant="secondary">
              Manage users
            </ButtonLink>
            <ButtonLink to="/admin/jobs">Review jobs</ButtonLink>
          </>
        }
      />

      {jobs.pending > 0 && (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex items-start gap-3">
            <Icon name="clipboard" className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
            <p className="text-sm text-amber-900 dark:text-amber-100">
              <span className="font-semibold">
                {jobs.pending} {jobs.pending === 1 ? 'job is' : 'jobs are'} waiting for review.
              </span>{' '}
              Candidates can't see a job until you approve it.
            </p>
          </div>
          <ButtonLink to="/admin/jobs" size="sm" variant="secondary" className="self-start sm:self-auto">
            Open review queue
          </ButtonLink>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="All users" value={users.total} tone="slate" icon="users" />
        <StatCard label="Recruiters" value={users.recruiters} tone="blue" icon="building" />
        <StatCard label="Candidates" value={users.candidates} tone="emerald" icon="user" />
        <StatCard label="Admins" value={users.admins} tone="red" icon="shield" />
      </div>

      <div className="mt-6">
        <StatusBreakdown
          title="Jobs by status"
          emptyText="No jobs have been posted yet."
          items={[
            { label: 'Pending review', value: jobs.pending, color: 'bg-amber-500' },
            { label: 'Approved', value: jobs.approved, color: 'bg-emerald-500' },
            { label: 'Rejected', value: jobs.rejected, color: 'bg-red-500' },
            { label: 'Closed', value: jobs.closed, color: 'bg-slate-400 dark:bg-slate-500' },
          ]}
        />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Oldest jobs awaiting review</h2>
          {jobs.pending > 0 && (
            <Link to="/admin/jobs" className="link text-sm">
              View all
            </Link>
          )}
        </div>

        {data.recentPendingJobs.length === 0 ? (
          <EmptyState icon="checkCircle" title="All caught up" message="There are no jobs waiting for review." />
        ) : (
          <JobTable jobs={data.recentPendingJobs} showCompany caption="Jobs awaiting review" />
        )}
      </section>
    </>
  )
}
