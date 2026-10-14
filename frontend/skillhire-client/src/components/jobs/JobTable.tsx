import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Job } from '../../types/job'
import { formatDate, formatExperience, formatSalary } from '../../utils/format'
import { CompanyLogo } from '../CompanyLogo'
import { StatusBadge } from '../StatusBadge'

interface JobTableProps {
  jobs: Job[]
  /** Show the company column (admin views). */
  showCompany?: boolean
  /** Show the application count, linking to the recruiter's applicants page. */
  showApplicants?: boolean
  /** Buttons rendered in the last column for each row. */
  renderActions?: (job: Job) => ReactNode
  onTitleClick?: (job: Job) => void
  /** Accessible table caption, visually hidden. */
  caption?: string
}

export function JobTable({ jobs, showCompany = false, showApplicants = false, renderActions, onTitleClick, caption = 'Jobs' }: JobTableProps) {
  return (
    <div className="card overflow-x-auto">
      <table className="data-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Job</th>
            {showCompany && <th scope="col">Company</th>}
            <th scope="col">Status</th>
            {showApplicants && <th scope="col">Applicants</th>}
            <th scope="col" className="hidden md:table-cell">
              Salary
            </th>
            <th scope="col" className="hidden lg:table-cell">
              Experience
            </th>
            <th scope="col" className="hidden lg:table-cell">
              Posted
            </th>
            {renderActions && (
              <th scope="col" className="text-right">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="align-top">
              <td className="min-w-48">
                {onTitleClick ? (
                  <button
                    type="button"
                    onClick={() => onTitleClick(job)}
                    className="text-left font-medium text-brand-navy hover:text-brand-blue hover:underline dark:text-slate-100 dark:hover:text-blue-400"
                  >
                    {job.title}
                  </button>
                ) : (
                  <p className="font-medium text-brand-navy dark:text-slate-100">{job.title}</p>
                )}
                <p className="mt-0.5 text-slate-500 dark:text-slate-400">{job.location ?? 'Location not set'}</p>
              </td>
              {showCompany && (
                <td>
                  <div className="flex items-center gap-3">
                    <CompanyLogo name={job.companyName} logoUrl={job.companyLogoUrl} />
                    <span className="font-medium text-slate-700 dark:text-slate-200">{job.companyName}</span>
                  </div>
                </td>
              )}
              <td>
                <StatusBadge status={job.status} />
                {job.status === 'Rejected' && job.rejectionReason && (
                  <p className="mt-1.5 max-w-xs text-xs text-red-700 dark:text-red-400">{job.rejectionReason}</p>
                )}
              </td>
              {showApplicants && (
                <td className="whitespace-nowrap">
                  {job.applicationCount > 0 ? (
                    <Link to={`/recruiter/applications?jobId=${job.id}`} className="link">
                      {job.applicationCount} {job.applicationCount === 1 ? 'applicant' : 'applicants'}
                    </Link>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">None yet</span>
                  )}
                </td>
              )}
              <td className="hidden whitespace-nowrap text-slate-700 md:table-cell dark:text-slate-200">{formatSalary(job.salaryMin, job.salaryMax)}</td>
              <td className="hidden whitespace-nowrap text-slate-700 lg:table-cell dark:text-slate-200">{formatExperience(job.experienceRequired)}</td>
              <td className="hidden whitespace-nowrap text-slate-500 lg:table-cell dark:text-slate-400">{formatDate(job.createdAt)}</td>
              {renderActions && (
                <td>
                  <div className="flex justify-end gap-2">{renderActions(job)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
