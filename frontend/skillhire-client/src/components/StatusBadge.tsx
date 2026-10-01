import type { JobStatus } from '../types/job'

const STYLES: Record<JobStatus, string> = {
  Pending: 'bg-amber-100 text-amber-800',
  Approved: 'bg-emerald-100 text-emerald-800',
  Rejected: 'bg-red-100 text-red-800',
  Closed: 'bg-slate-200 text-slate-700',
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
