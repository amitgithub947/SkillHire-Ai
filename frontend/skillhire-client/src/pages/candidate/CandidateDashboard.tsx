import { Link } from 'react-router-dom'
import { RecommendedJobs } from '../../components/ai/RecommendedJobs'
import { Alert } from '../../components/Alert'
import { ApplicationStatusBadge } from '../../components/applications/ApplicationStatusBadge'
import { ButtonLink } from '../../components/Button'
import { CompanyLogo } from '../../components/CompanyLogo'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { InterviewCard } from '../../components/interviews/InterviewCard'
import { JobListingCard } from '../../components/jobs/JobListingCard'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { StatCard } from '../../components/StatCard'
import { useApi } from '../../hooks/useApi'
import { candidateService } from '../../services/candidateService'
import { formatDate } from '../../utils/format'

export default function CandidateDashboard() {
  const { data, error, isLoading, reload } = useApi(() => candidateService.getDashboard())

  if (isLoading) return <LoadingState message="Loading your dashboard…" />
  if (error || !data) return <ErrorState message={error ?? 'Could not load dashboard.'} onRetry={reload} />

  const firstName = data.name.split(' ')[0]

  return (
    <>
      <PageHeader
        eyebrow="Your job search"
        title={`Welcome back, ${firstName}`}
        subtitle="Track your applications, interviews and the jobs that fit your skills."
        actions={<ButtonLink to="/candidate/jobs">Find jobs</ButtonLink>}
      />

      {!data.hasResume ? (
        <div className="mb-6">
          <Alert variant="info">
            Upload your resume so you can start applying.{' '}
            <Link to="/candidate/resume" className="font-medium underline">
              Upload resume
            </Link>
          </Alert>
        </div>
      ) : (
        !data.profileComplete && (
          <div className="mb-6">
            <Alert variant="info">
              Add your phone, location and skills so recruiters know more about you.{' '}
              <Link to="/candidate/profile" className="font-medium underline">
                Complete profile
              </Link>
            </Alert>
          </div>
        )
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Applications" value={data.applications.total} tone="blue" icon="briefcase" />
        <StatCard label="Awaiting review" value={data.applications.applied} tone="slate" icon="inbox" />
        <StatCard label="Shortlisted" value={data.applications.shortlisted} tone="violet" icon="check" />
        <StatCard label="Interviews" value={data.applications.interviewScheduled} tone="amber" icon="calendar" />
        <StatCard label="Selected" value={data.applications.selected} tone="emerald" icon="checkCircle" />
      </div>

      <RecommendedJobs />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <SectionHeader title="Upcoming interviews" to="/candidate/interviews" show={data.upcomingInterviews.length > 0} />
          {data.upcomingInterviews.length === 0 ? (
            <EmptyState icon="calendar" title="No interviews scheduled" message="Interviews recruiters schedule with you show up here." />
          ) : (
            <div className="space-y-3">
              {data.upcomingInterviews.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} perspective="candidate" />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader title="Recent applications" to="/candidate/applications" show={data.recentApplications.length > 0} />
          {data.recentApplications.length === 0 ? (
            <EmptyState
              title="No applications yet"
              message="Apply for a job and track its progress here."
              action={<ButtonLink to="/candidate/jobs">Browse jobs</ButtonLink>}
            />
          ) : (
            <ul className="card divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentApplications.map((application) => (
                <li key={application.id} className="flex items-center gap-4 px-5 py-4">
                  <CompanyLogo name={application.companyName} logoUrl={application.companyLogoUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-brand-navy dark:text-slate-100">{application.jobTitle}</p>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                      {application.companyName} · Applied {formatDate(application.appliedAt)}
                    </p>
                  </div>
                  <ApplicationStatusBadge status={application.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8">
        <SectionHeader title="New jobs for you" to="/candidate/jobs" show={data.latestJobs.length > 0} />
        {data.latestJobs.length === 0 ? (
          <EmptyState title="No new jobs right now" message="You have seen every open job. Check back soon." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.latestJobs.map((job) => (
              <JobListingCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function SectionHeader({ title, to, show }: { title: string; to: string; show: boolean }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="section-title">{title}</h2>
      {show && (
        <Link to={to} className="text-sm link">
          View all
        </Link>
      )}
    </div>
  )
}
