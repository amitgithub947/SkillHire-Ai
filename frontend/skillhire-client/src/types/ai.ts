import type { JobListing } from './job'

export interface ResumeExperience {
  role: string
  organization: string | null
  duration: string | null
  highlights: string[]
}

export interface ResumeEducation {
  degree: string
  institution: string | null
  year: string | null
}

export interface ResumeProject {
  name: string
  description: string
  technologies: string[]
}

export interface ResumeAnalysis {
  id: number
  resumeFileName: string | null
  summary: string
  totalExperienceYears: number | null
  skills: string[]
  technologies: string[]
  experience: ResumeExperience[]
  education: ResumeEducation[]
  projects: ResumeProject[]
  createdAt: string
}

/** Guidance only: it never selects or rejects anyone. */
export interface SkillMatch {
  jobId: number
  matchPercentage: number
  matchedSkills: string[]
  missingSkills: string[]
  summary: string
  usedResumeAnalysis: boolean
}

export interface JobMatch {
  job: JobListing
  matchPercentage: number
  matchedSkills: string[]
  reason: string
}
