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
import { StatusBreakdown } from '../../components/StatusBreakdown'
import { useApi } from '../../hooks/useApi'
import { employerService } from '../../services/employerService'

export default function RecruiterDashboard() {
  const { data, error, isLoading, reload } = useApi(() => employerService.getDashboard())

  if (isLoading) return <LoadingState message="Loading your dashboard…" />
  if (error || !data) return <ErrorState message={error ?? 'Could not load dashboard.'} onRetry={reload} />

  const { jobs, applications } = data

  return (
    <>
      <PageHeader
        eyebrow="Recruiter workspace"
        title={data.companyName}
        subtitle="Your open roles and where every applicant stands."
        actions={<ButtonLink to="/recruiter/jobs/new">Post a job</ButtonLink>}
      />

      {!data.profileComplete && (
        <div className="mb-6">
          <Alert variant="info">
            Your company profile is incomplete. Candidates trust complete profiles more.{' '}
            <Link to="/recruiter/profile" className="font-medium underline">
              Complete it now
            </Link>
          </Alert>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Live jobs" value={jobs.approved} tone="emerald" icon="briefcase" hint={`${jobs.total} posted in total`} />
        <StatCard label="Awaiting approval" value={jobs.pending} tone="amber" icon="clipboard" hint="Reviewed by an admin" />
        <StatCard label="Need changes" value={jobs.rejected} tone="red" icon="alert" hint="Rejected with a reason" />
        <StatCard label="Closed" value={jobs.closed} tone="slate" icon="check" hint="No longer accepting" />
      </div>

      <div className="mt-6">
        <StatusBreakdown
          title="Applicant pipeline"
          emptyText="No applications yet. They will show up here once candidates apply."
          action={
            applications.total > 0 && (
              <Link to="/recruiter/applications" className="link text-sm">
                Review applicants
              </Link>
            )
          }
          items={[
            { label: 'New', value: applications.applied, color: 'bg-blue-500' },
            { label: 'Shortlisted', value: applications.shortlisted, color: 'bg-violet-500' },
            { label: 'Interviewing', value: applications.interviewScheduled, color: 'bg-amber-500' },
            { label: 'Selected', value: applications.selected, color: 'bg-emerald-500' },
            { label: 'Rejected', value: applications.rejected, color: 'bg-slate-400 dark:bg-slate-500' },
          ]}
        />
      </div>

      {data.upcomingInterviews.length > 0 && (
        <section className="mt-8">
          <h2 className="section-title mb-3">Upcoming interviews</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {data.upcomingInterviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                interview={interview}
                perspective="recruiter"
                actions={
                  <ButtonLink to={`/recruiter/applications/${interview.applicationId}`} variant="secondary" size="sm">
                    Open
                  </ButtonLink>
                }
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Recent jobs</h2>
          {data.recentJobs.length > 0 && (
            <Link to="/recruiter/jobs" className="link text-sm">
              View all
            </Link>
          )}
        </div>

        {data.recentJobs.length === 0 ? (
          <EmptyState
            icon="briefcase"
            title="No jobs yet"
            message="Post your first job. An admin will review it before candidates can see it."
            action={<ButtonLink to="/recruiter/jobs/new">Post your first job</ButtonLink>}
          />
        ) : (
          <JobTable jobs={data.recentJobs} showApplicants caption="Recent jobs" />
        )}
      </section>
    </>
  )
}
