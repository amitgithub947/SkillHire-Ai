import { Link } from 'react-router-dom'
import { ButtonLink } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { JobTable } from '../../components/jobs/JobTable'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { StatCard } from '../../components/StatCard'
import { useApi } from '../../hooks/useApi'
import { adminService } from '../../services/adminService'

export default function AdminDashboard() {
  const { data, error, isLoading, reload } = useApi(() => adminService.getDashboard())

  if (isLoading) return <LoadingState message="Loading platform overview…" />
  if (error || !data) return <ErrorState message={error ?? 'Could not load dashboard.'} onRetry={reload} />

  return (
    <>
      <PageHeader
        title="Admin dashboard"
        subtitle="Platform overview and jobs waiting for review."
        actions={
          <>
            <ButtonLink to="/admin/users" variant="secondary">
              Manage users
            </ButtonLink>
            <ButtonLink to="/admin/jobs">Review jobs</ButtonLink>
          </>
        }
      />

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Users</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total users" value={data.users.total} tone="blue" />
        <StatCard label="Employers" value={data.users.employers} tone="violet" />
        <StatCard label="Candidates" value={data.users.candidates} tone="emerald" />
        <StatCard label="Admins" value={data.users.admins} tone="slate" />
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Jobs</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="Total jobs" value={data.jobs.total} tone="blue" />
        <StatCard label="Pending review" value={data.jobs.pending} tone="amber" />
        <StatCard label="Approved" value={data.jobs.approved} tone="emerald" />
        <StatCard label="Rejected" value={data.jobs.rejected} tone="red" />
        <StatCard label="Closed" value={data.jobs.closed} tone="slate" />
      </div>

      <div className="mt-10 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-navy dark:text-slate-100">Oldest jobs awaiting review</h2>
        {data.jobs.pending > 0 && (
          <Link to="/admin/jobs" className="text-sm font-semibold text-brand-blue dark:text-blue-400 hover:underline">
            Open review queue
          </Link>
        )}
      </div>

      {data.recentPendingJobs.length === 0 ? (
        <EmptyState title="All caught up" message="There are no jobs waiting for review." />
      ) : (
        <JobTable jobs={data.recentPendingJobs} showCompany />
      )}
    </>
  )
}
