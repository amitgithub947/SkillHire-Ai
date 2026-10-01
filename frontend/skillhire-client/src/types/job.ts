export const JOB_STATUSES = ['Pending', 'Approved', 'Rejected', 'Closed'] as const
export type JobStatus = (typeof JOB_STATUSES)[number]

export interface Job {
  id: number
  employerId: number
  companyName: string
  companyLogoUrl: string | null
  title: string
  description: string
  requirements: string
  location: string | null
  salaryMin: number | null
  salaryMax: number | null
  experienceRequired: number
  status: JobStatus
  rejectionReason: string | null
  createdAt: string
  updatedAt: string | null
  reviewedAt: string | null
}

/** Body for creating or editing a job. Status is never sent: only admins change it. */
export interface JobInput {
  title: string
  description: string
  requirements: string
  location: string | null
  salaryMin: number | null
  salaryMax: number | null
  experienceRequired: number
}

export interface JobStats {
  total: number
  pending: number
  approved: number
  rejected: number
  closed: number
}
