import type { ApplicationStatus } from './application'

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
  /** Comma-separated, e.g. "React, TypeScript". */
  skills: string | null
  location: string | null
  salaryMin: number | null
  salaryMax: number | null
  experienceRequired: number
  status: JobStatus
  rejectionReason: string | null
  createdAt: string
  updatedAt: string | null
  reviewedAt: string | null
  applicationCount: number
}

/** Body for creating or editing a job. Status is never sent: only admins change it. */
export interface JobInput {
  title: string
  description: string
  requirements: string
  skills: string | null
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

/** An approved job as candidates see it. */
export interface JobListing {
  id: number
  title: string
  companyName: string
  companyLogoUrl: string | null
  location: string | null
  skills: string[]
  salaryMin: number | null
  salaryMax: number | null
  experienceRequired: number
  postedAt: string
  /** Set when the logged-in candidate has already applied. */
  applicationId: number | null
  applicationStatus: ApplicationStatus | null
}

export interface JobListingDetails extends JobListing {
  description: string
  requirements: string
  companyDescription: string | null
  companyWebsite: string | null
  companyLocation: string | null
}

export interface JobSearchFilters {
  search: string
  location: string
  /** Candidate's years of experience, as typed. Empty = no filter. */
  experience: string
  /** Comma-separated; a job must match every skill. */
  skills: string
  page: number
}
