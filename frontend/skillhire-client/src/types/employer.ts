import type { ApplicationStats } from './application'
import type { Interview } from './interview'
import type { Job, JobStats } from './job'

export interface EmployerProfile {
  id: number
  companyName: string
  companyDescription: string | null
  location: string | null
  website: string | null
  logoUrl: string | null
  contactName: string
  contactEmail: string
  isComplete: boolean
}

export interface EmployerProfileInput {
  companyName: string
  companyDescription: string | null
  location: string | null
  website: string | null
  logoUrl: string | null
}

export interface EmployerDashboard {
  companyName: string
  profileComplete: boolean
  jobs: JobStats
  recentJobs: Job[]
  applications: ApplicationStats
  upcomingInterviews: Interview[]
}
