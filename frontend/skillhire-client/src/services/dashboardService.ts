import type { DashboardInfo } from '../types/api'
import type { UserRole } from '../types/auth'
import { api } from './api'

export const dashboardService = {
  async get(role: UserRole): Promise<DashboardInfo> {
    const { data } = await api.get<DashboardInfo>(`/api/dashboard/${role.toLowerCase()}`)
    return data
  },
}
