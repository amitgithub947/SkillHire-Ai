import type { Job } from '../../types/job'
import { formatDate, formatExperience, formatSalary, parseSkills } from '../../utils/format'
import { CompanyLogo } from '../CompanyLogo'
import { SkillTags } from '../SkillTags'
import { StatusBadge } from '../StatusBadge'

export function JobDetails({ job }: { job: Job }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <CompanyLogo name={job.companyName} logoUrl={job.companyLogoUrl} />
        <div>
          <h3 className="text-lg font-semibold text-brand-navy dark:text-slate-100">{job.title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{job.companyName}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={job.status} />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 text-sm sm:grid-cols-4">
        <Fact label="Location" value={job.location ?? '—'} />
        <Fact label="Salary" value={formatSalary(job.salaryMin, job.salaryMax)} />
        <Fact label="Experience" value={formatExperience(job.experienceRequired)} />
        <Fact label="Posted" value={formatDate(job.createdAt)} />
      </dl>

      {job.status === 'Rejected' && job.rejectionReason && (
        <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
          <span className="font-semibold">Rejection reason:</span> {job.rejectionReason}
        </div>
      )}

      <Section title="Description" text={job.description} />
      <Section title="Requirements" text={job.requirements} />
      {job.skills && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Key skills</h4>
          <SkillTags skills={parseSkills(job.skills)} />
        </div>
      )}
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 font-medium text-slate-800 dark:text-slate-100">{value}</dd>
    </div>
  )
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h4>
      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">{text}</p>
    </div>
  )
}
