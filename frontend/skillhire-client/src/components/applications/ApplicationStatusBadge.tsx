import type { ApplicationStatus } from '../../types/application'
import { APPLICATION_STATUS_LABELS } from '../../utils/labels'

const STYLES: Record<ApplicationStatus, string> = {
  Applied: 'bg-blue-100 text-blue-800',
  Shortlisted: 'bg-violet-100 text-violet-800',
  InterviewScheduled: 'bg-amber-100 text-amber-800',
  Selected: 'bg-emerald-100 text-emerald-800',
  Rejected: 'bg-red-100 text-red-800',
}

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}>
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  )
}
