import type { PagedResult } from '../types/api'
import type { ApplicationStatus, CandidateApplication } from '../types/application'
import type { CandidateDashboard, CandidateProfile, CandidateProfileInput } from '../types/candidate'
import type { Interview } from '../types/interview'
import type { JobListing, JobListingDetails, JobSearchFilters } from '../types/job'
import { api } from './api'
import { fetchFile } from './fileService'

export const JOBS_PAGE_SIZE = 10

export const candidateService = {
  async getDashboard(): Promise<CandidateDashboard> {
    const { data } = await api.get<CandidateDashboard>('/api/candidate/dashboard')
    return data
  },

  async getProfile(): Promise<CandidateProfile> {
    const { data } = await api.get<CandidateProfile>('/api/candidate/profile')
    return data
  },

  async updateProfile(input: CandidateProfileInput): Promise<CandidateProfile> {
    const { data } = await api.put<CandidateProfile>('/api/candidate/profile', input)
    return data
  },

  async uploadResume(file: File, onProgress?: (percent: number) => void): Promise<CandidateProfile> {
    const form = new FormData()
    form.append('File', file)
    const { data } = await api.post<CandidateProfile>('/api/candidate/resume', form, {
      // Overrides the JSON default; Axios then lets the browser add the multipart boundary.
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100))
      },
    })
    return data
  },

  async deleteResume(): Promise<CandidateProfile> {
    const { data } = await api.delete<CandidateProfile>('/api/candidate/resume')
    return data
  },

  downloadResume(fallbackName: string) {
    return fetchFile('/api/candidate/resume', fallbackName)
  },

  async searchJobs(filters: JobSearchFilters): Promise<PagedResult<JobListing>> {
    const experience = filters.experience.trim()
    const { data } = await api.get<PagedResult<JobListing>>('/api/candidate/jobs', {
      params: {
        search: filters.search.trim() || undefined,
        location: filters.location.trim() || undefined,
        experience: experience === '' ? undefined : Number(experience),
        skills: filters.skills.trim() || undefined,
        page: filters.page,
        pageSize: JOBS_PAGE_SIZE,
      },
    })
    return data
  },

  async getJob(id: number): Promise<JobListingDetails> {
    const { data } = await api.get<JobListingDetails>(`/api/candidate/jobs/${id}`)
    return data
  },

  async apply(jobId: number, coverLetter: string | null): Promise<CandidateApplication> {
    const { data } = await api.post<CandidateApplication>('/api/candidate/applications', { jobId, coverLetter })
    return data
  },

  async getApplications(status?: ApplicationStatus): Promise<CandidateApplication[]> {
    const { data } = await api.get<CandidateApplication[]>('/api/candidate/applications', { params: { status } })
    return data
  },

  async updateApplication(id: number, coverLetter: string | null): Promise<CandidateApplication> {
    const { data } = await api.put<CandidateApplication>(`/api/candidate/applications/${id}`, { coverLetter })
    return data
  },

  async withdrawApplication(id: number): Promise<void> {
    await api.delete(`/api/candidate/applications/${id}`)
  },

  async getInterviews(upcoming = false): Promise<Interview[]> {
    const { data } = await api.get<Interview[]>('/api/candidate/interviews', { params: { upcoming } })
    return data
  },
}
