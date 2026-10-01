import type { Job } from '../../types/job'
import { formatDate, formatExperience, formatSalary } from '../../utils/format'
import { CompanyLogo } from '../CompanyLogo'
import { StatusBadge } from '../StatusBadge'

export function JobDetails({ job }: { job: Job }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <CompanyLogo name={job.companyName} logoUrl={job.companyLogoUrl} />
        <div>
          <h3 className="text-lg font-semibold text-brand-navy">{job.title}</h3>
          <p className="text-sm text-slate-500">{job.companyName}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={job.status} />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-4">
        <Fact label="Location" value={job.location ?? '—'} />
        <Fact label="Salary" value={formatSalary(job.salaryMin, job.salaryMax)} />
        <Fact label="Experience" value={formatExperience(job.experienceRequired)} />
        <Fact label="Posted" value={formatDate(job.createdAt)} />
      </dl>

      {job.status === 'Rejected' && job.rejectionReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span className="font-semibold">Rejection reason:</span> {job.rejectionReason}
        </div>
      )}

      <Section title="Description" text={job.description} />
      <Section title="Requirements" text={job.requirements} />
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-slate-800">{value}</dd>
    </div>
  )
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">{text}</p>
    </div>
  )
}
