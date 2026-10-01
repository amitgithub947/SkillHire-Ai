import type { EmployerApplicationDetails } from '../types/application'

/** Mirrors the API rule: active applications with no interview already scheduled. */
export function canScheduleInterview(application: EmployerApplicationDetails): boolean {
  return (
    ['Applied', 'Shortlisted', 'InterviewScheduled'].includes(application.status) &&
    !application.interviews.some((i) => i.status === 'Scheduled')
  )
}
