import type { JobStatus } from '../types/job'

const STYLES: Record<JobStatus, string> = {
  Pending: 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200',
  Approved: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  Rejected: 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-200',
  Closed: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200',
}

const LABELS: Record<JobStatus, string> = {
  Pending: 'Pending review',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Closed: 'Closed',
}

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  )
}
