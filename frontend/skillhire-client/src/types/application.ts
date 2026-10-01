import type { Interview } from './interview'
import type { JobStatus } from './job'

export const APPLICATION_STATUSES = ['Applied', 'Shortlisted', 'InterviewScheduled', 'Selected', 'Rejected'] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export interface ApplicationStats {
  total: number
  applied: number
  shortlisted: number
  interviewScheduled: number
  selected: number
  rejected: number
}

/** An application as seen by the candidate who made it. */
export interface CandidateApplication {
  id: number
  jobId: number
  jobTitle: string
  companyName: string
  companyLogoUrl: string | null
  jobLocation: string | null
  jobStatus: JobStatus
  coverLetter: string | null
  status: ApplicationStatus
  appliedAt: string
  updatedAt: string | null
  interviews: Interview[]
}

/** One row in the employer's applications list. */
export interface EmployerApplication {
  id: number
  jobId: number
  jobTitle: string
  candidateId: number
  candidateName: string
  candidateEmail: string
  candidateLocation: string | null
  candidateExperienceYears: number
  candidateSkills: string[]
  hasResume: boolean
  status: ApplicationStatus
  appliedAt: string
  updatedAt: string | null
  nextInterviewAt: string | null
}

export interface EmployerApplicationDetails extends EmployerApplication {
  coverLetter: string | null
  jobStatus: JobStatus
  jobSkills: string | null
  candidatePhone: string | null
  candidateExperience: string | null
  resumeUrl: string | null
  resumeFileName: string | null
  interviews: Interview[]
}

export interface EmployerApplicationFilters {
  jobId?: number
  status?: ApplicationStatus
  search?: string
}
