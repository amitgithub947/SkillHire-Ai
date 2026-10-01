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
  /** Show the application count, linking to the employer's applications page. */
  showApplicants?: boolean
  /** Buttons rendered in the last column for each row. */
  renderActions?: (job: Job) => ReactNode
  onTitleClick?: (job: Job) => void
}

export function JobTable({ jobs, showCompany = false, showApplicants = false, renderActions, onTitleClick }: JobTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <tr>
            <th className="px-5 py-3">Job</th>
            {showCompany && <th className="px-5 py-3">Company</th>}
            <th className="px-5 py-3">Status</th>
            {showApplicants && <th className="px-5 py-3">Applicants</th>}
            <th className="hidden px-5 py-3 md:table-cell">Salary</th>
            <th className="hidden px-5 py-3 lg:table-cell">Experience</th>
            <th className="hidden px-5 py-3 lg:table-cell">Posted</th>
            {renderActions && <th className="px-5 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {jobs.map((job) => (
            <tr key={job.id} className="align-top hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
              <td className="px-5 py-4">
                {onTitleClick ? (
                  <button
                    type="button"
                    onClick={() => onTitleClick(job)}
                    className="text-left font-semibold text-brand-navy dark:text-slate-100 hover:text-brand-blue dark:hover:text-blue-400 hover:underline"
                  >
                    {job.title}
                  </button>
                ) : (
                  <p className="font-semibold text-brand-navy dark:text-slate-100">{job.title}</p>
                )}
                <p className="mt-0.5 text-slate-500 dark:text-slate-400">{job.location ?? 'Location not set'}</p>
              </td>
              {showCompany && (
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <CompanyLogo name={job.companyName} logoUrl={job.companyLogoUrl} />
                    <span className="font-medium text-slate-700 dark:text-slate-200">{job.companyName}</span>
                  </div>
                </td>
              )}
              <td className="px-5 py-4">
                <StatusBadge status={job.status} />
                {job.status === 'Rejected' && job.rejectionReason && (
                  <p className="mt-1.5 max-w-xs text-xs text-red-600 dark:text-red-400">{job.rejectionReason}</p>
                )}
              </td>
              {showApplicants && (
                <td className="whitespace-nowrap px-5 py-4">
                  {job.applicationCount > 0 ? (
                    <Link
                      to={`/employer/applications?jobId=${job.id}`}
                      className="font-semibold text-brand-blue dark:text-blue-400 hover:underline"
                    >
                      {job.applicationCount} {job.applicationCount === 1 ? 'applicant' : 'applicants'}
                    </Link>
                  ) : (
                    <span className="text-slate-400">None yet</span>
                  )}
                </td>
              )}
              <td className="hidden whitespace-nowrap px-5 py-4 text-slate-700 dark:text-slate-200 md:table-cell">
                {formatSalary(job.salaryMin, job.salaryMax)}
              </td>
              <td className="hidden whitespace-nowrap px-5 py-4 text-slate-700 dark:text-slate-200 lg:table-cell">
                {formatExperience(job.experienceRequired)}
              </td>
              <td className="hidden whitespace-nowrap px-5 py-4 text-slate-500 dark:text-slate-400 lg:table-cell">{formatDate(job.createdAt)}</td>
              {renderActions && (
                <td className="px-5 py-4">
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
