import type { ApplicationStatus } from '../../types/application'
import { APPLICATION_STATUS_LABELS } from '../../utils/labels'

const STYLES: Record<ApplicationStatus, string> = {
  Applied: 'bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-200',
  Shortlisted: 'bg-violet-100 dark:bg-violet-500/15 text-violet-800 dark:text-violet-200',
  InterviewScheduled: 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200',
  Selected: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  Rejected: 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-200',
}

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}>
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  )
}
