import type { AdminCandidate, AdminDashboard, AdminEmployer, AdminUser } from '../types/admin'
import type { Job } from '../types/job'
import { api } from './api'

export const adminService = {
  async getDashboard(): Promise<AdminDashboard> {
    const { data } = await api.get<AdminDashboard>('/api/admin/dashboard')
    return data
  },

  async getUsers(): Promise<AdminUser[]> {
    const { data } = await api.get<AdminUser[]>('/api/admin/users')
    return data
  },

  async getEmployers(): Promise<AdminEmployer[]> {
    const { data } = await api.get<AdminEmployer[]>('/api/admin/employers')
    return data
  },

  async getCandidates(): Promise<AdminCandidate[]> {
    const { data } = await api.get<AdminCandidate[]>('/api/admin/candidates')
    return data
  },

  async getJobs(): Promise<Job[]> {
    const { data } = await api.get<Job[]>('/api/admin/jobs')
    return data
  },

  async approveJob(id: number): Promise<Job> {
    const { data } = await api.patch<Job>(`/api/admin/jobs/${id}/approve`)
    return data
  },

  async rejectJob(id: number, reason: string): Promise<Job> {
    const { data } = await api.patch<Job>(`/api/admin/jobs/${id}/reject`, { reason })
    return data
  },
}
