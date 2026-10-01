import { Link } from 'react-router-dom'
import type { JobListing } from '../../types/job'
import { formatDate, formatExperience, formatSalary } from '../../utils/format'
import { ApplicationStatusBadge } from '../applications/ApplicationStatusBadge'
import { CompanyLogo } from '../CompanyLogo'
import { SkillTags } from '../SkillTags'

interface JobListingCardProps {
  job: JobListing
  /** Candidate's own skills, highlighted in the job's skill list. */
  mySkills?: string[]
}

export function JobListingCard({ job, mySkills }: JobListingCardProps) {
  return (
    <Link
      to={`/candidate/jobs/${job.id}`}
      className="group block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
    >
      <div className="flex items-start gap-4">
        <CompanyLogo name={job.companyName} logoUrl={job.companyLogoUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-brand-navy dark:text-slate-100 group-hover:text-brand-blue dark:group-hover:text-blue-400">{job.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{job.companyName}</p>
            </div>
            {job.applicationStatus && <ApplicationStatusBadge status={job.applicationStatus} />}
          </div>

          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
            <div>
              <dt className="sr-only">Location</dt>
              <dd>{job.location ?? 'Location not set'}</dd>
            </div>
            <div>
              <dt className="sr-only">Experience</dt>
              <dd>{formatExperience(job.experienceRequired)}</dd>
            </div>
            <div>
              <dt className="sr-only">Salary</dt>
              <dd>{formatSalary(job.salaryMin, job.salaryMax)}</dd>
            </div>
          </dl>

          {job.skills.length > 0 && (
            <div className="mt-3">
              <SkillTags skills={job.skills} highlight={mySkills} max={6} />
            </div>
          )}

          <p className="mt-3 text-xs text-slate-400">Posted {formatDate(job.postedAt)}</p>
        </div>
      </div>
    </Link>
  )
}
