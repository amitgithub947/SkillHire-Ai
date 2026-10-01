import { Link } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { ButtonLink } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { InterviewCard } from '../../components/interviews/InterviewCard'
import { JobTable } from '../../components/jobs/JobTable'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { StatCard } from '../../components/StatCard'
import { useApi } from '../../hooks/useApi'
import { employerService } from '../../services/employerService'

export default function EmployerDashboard() {
  const { data, error, isLoading, reload } = useApi(() => employerService.getDashboard())

  if (isLoading) return <LoadingState message="Loading your dashboard…" />
  if (error || !data) return <ErrorState message={error ?? 'Could not load dashboard.'} onRetry={reload} />

  return (
    <>
      <PageHeader
        title={`Welcome, ${data.companyName}`}
        subtitle="Here's how your job posts are doing."
        actions={<ButtonLink to="/employer/jobs/new">Post a job</ButtonLink>}
      />

      {!data.profileComplete && (
        <div className="mb-6">
          <Alert variant="info">
            Your company profile is incomplete. Candidates trust complete profiles more.{' '}
            <Link to="/employer/profile" className="font-semibold underline">
              Complete it now
            </Link>
          </Alert>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="Total jobs" value={data.jobs.total} tone="blue" />
        <StatCard label="Pending review" value={data.jobs.pending} tone="amber" />
        <StatCard label="Approved" value={data.jobs.approved} tone="emerald" />
        <StatCard label="Rejected" value={data.jobs.rejected} tone="red" />
        <StatCard label="Closed" value={data.jobs.closed} tone="slate" />
      </div>

      <div className="mt-10 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-navy dark:text-slate-100">Applications</h2>
        {data.applications.total > 0 && (
          <Link to="/employer/applications" className="text-sm font-semibold text-brand-blue dark:text-blue-400 hover:underline">
            Review applications
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="New" value={data.applications.applied} tone="blue" />
        <StatCard label="Shortlisted" value={data.applications.shortlisted} tone="violet" />
        <StatCard label="Interviewing" value={data.applications.interviewScheduled} tone="amber" />
        <StatCard label="Selected" value={data.applications.selected} tone="emerald" />
        <StatCard label="Rejected" value={data.applications.rejected} tone="red" />
      </div>

      {data.upcomingInterviews.length > 0 && (
        <>
          <h2 className="mt-10 mb-4 text-lg font-semibold text-brand-navy dark:text-slate-100">Upcoming interviews</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {data.upcomingInterviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                interview={interview}
                perspective="employer"
                actions={
                  <ButtonLink to={`/employer/applications/${interview.applicationId}`} variant="secondary" size="sm">
                    Open
                  </ButtonLink>
                }
              />
            ))}
          </div>
        </>
      )}

      <div className="mt-10 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-navy dark:text-slate-100">Recent jobs</h2>
        {data.recentJobs.length > 0 && (
          <Link to="/employer/jobs" className="text-sm font-semibold text-brand-blue dark:text-blue-400 hover:underline">
            View all
          </Link>
        )}
      </div>

      {data.recentJobs.length === 0 ? (
        <EmptyState
          title="No jobs yet"
          message="Post your first job. An admin will review it before candidates can see it."
          action={<ButtonLink to="/employer/jobs/new">Post your first job</ButtonLink>}
        />
      ) : (
        <JobTable jobs={data.recentJobs} showApplicants />
      )}
    </>
  )
}
