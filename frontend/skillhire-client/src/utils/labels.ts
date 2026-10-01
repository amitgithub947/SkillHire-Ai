import type { ApplicationStatus } from '../types/application'
import type { InterviewType } from '../types/interview'

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  Applied: 'Applied',
  Shortlisted: 'Shortlisted',
  InterviewScheduled: 'Interview scheduled',
  Selected: 'Selected',
  Rejected: 'Not selected',
}

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  Online: 'Online meeting',
  InPerson: 'In person',
  Phone: 'Phone call',
}
