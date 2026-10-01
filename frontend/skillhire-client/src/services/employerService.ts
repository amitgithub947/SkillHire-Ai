import type { EmployerDashboard, EmployerProfile, EmployerProfileInput } from '../types/employer'
import type { Job, JobInput } from '../types/job'
import { api } from './api'

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
}
