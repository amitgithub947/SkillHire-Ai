import type { UserRole } from './auth'
import type { Job, JobStats } from './job'

export interface AdminUser {
  id: number
  name: string
  email: string
  role: UserRole
  createdAt: string
}

export interface AdminEmployer {
  employerId: number
  userId: number
  contactName: string
  email: string
  companyName: string
  location: string | null
  website: string | null
  logoUrl: string | null
  jobCount: number
  createdAt: string
}

export interface AdminCandidate {
  candidateId: number
  userId: number
  name: string
  email: string
  phone: string | null
  location: string | null
  skills: string | null
  experience: string | null
  createdAt: string
}

export interface UserStats {
  total: number
  admins: number
  employers: number
  candidates: number
}

export interface AdminDashboard {
  users: UserStats
  jobs: JobStats
  recentPendingJobs: Job[]
}
