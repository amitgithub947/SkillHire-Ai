import type { ApplicationStats, CandidateApplication } from './application'
import type { Interview } from './interview'
import type { JobListing } from './job'

export interface CandidateProfile {
  id: number
  name: string
  email: string
  phone: string | null
  location: string | null
  skills: string[]
  experienceYears: number
  experience: string | null
  resumeUrl: string | null
  resumeFileName: string | null
  resumeUploadedAt: string | null
  hasResume: boolean
  isComplete: boolean
}

export interface CandidateProfileInput {
  phone: string | null
  location: string | null
  /** Comma-separated. */
  skills: string | null
  experienceYears: number
  experience: string | null
  resumeUrl: string | null
}

export interface CandidateDashboard {
  name: string
  profileComplete: boolean
  hasResume: boolean
  applications: ApplicationStats
  upcomingInterviews: Interview[]
  recentApplications: CandidateApplication[]
  latestJobs: JobListing[]
}
