import type {
  EmployerApplication,
  EmployerApplicationDetails,
  EmployerApplicationFilters,
} from '../types/application'
import type { EmployerDashboard, EmployerProfile, EmployerProfileInput } from '../types/employer'
import type { Interview, ScheduleInterviewInput, UpdateInterviewStatusInput } from '../types/interview'
import type { Job, JobInput } from '../types/job'
import { api } from './api'
import { fetchFile } from './fileService'

export const employerService = {
  async getDashboard(): Promise<EmployerDashboard> {
    const { data } = await api.get<EmployerDashboard>('/api/employer/dashboard')
    return data
  },

  async getProfile(): Promise<EmployerProfile> {
    const { data } = await api.get<EmployerProfile>('/api/employer/profile')
    return data
  },

  async updateProfile(input: EmployerProfileInput): Promise<EmployerProfile> {
    const { data } = await api.put<EmployerProfile>('/api/employer/profile', input)
    return data
  },

  async getMyJobs(): Promise<Job[]> {
    const { data } = await api.get<Job[]>('/api/employer/jobs')
    return data
  },

  async getMyJob(id: number): Promise<Job> {
    const { data } = await api.get<Job>(`/api/employer/jobs/${id}`)
    return data
  },

  async createJob(input: JobInput): Promise<Job> {
    const { data } = await api.post<Job>('/api/employer/jobs', input)
    return data
  },

  async updateJob(id: number, input: JobInput): Promise<Job> {
    const { data } = await api.put<Job>(`/api/employer/jobs/${id}`, input)
    return data
  },

  async closeJob(id: number): Promise<Job> {
    const { data } = await api.patch<Job>(`/api/employer/jobs/${id}/close`)
    return data
  },

  async getApplications(filters: EmployerApplicationFilters = {}): Promise<EmployerApplication[]> {
    const { data } = await api.get<EmployerApplication[]>('/api/employer/applications', {
      params: { jobId: filters.jobId, status: filters.status, search: filters.search?.trim() || undefined },
    })
    return data
  },

  async getApplication(id: number): Promise<EmployerApplicationDetails> {
    const { data } = await api.get<EmployerApplicationDetails>(`/api/employer/applications/${id}`)
    return data
  },

  downloadResume(applicationId: number, fallbackName: string) {
    return fetchFile(`/api/employer/applications/${applicationId}/resume`, fallbackName)
  },

  async changeApplicationStatus(
    id: number,
    action: 'shortlist' | 'reject' | 'select',
  ): Promise<EmployerApplicationDetails> {
    const { data } = await api.patch<EmployerApplicationDetails>(`/api/employer/applications/${id}/${action}`)
    return data
  },

  async scheduleInterview(applicationId: number, input: ScheduleInterviewInput): Promise<Interview> {
    const { data } = await api.post<Interview>(`/api/employer/applications/${applicationId}/interviews`, input)
    return data
  },

  async updateInterviewStatus(id: number, input: UpdateInterviewStatusInput): Promise<Interview> {
    const { data } = await api.patch<Interview>(`/api/employer/interviews/${id}`, input)
    return data
  },
}
