import type { UserRole } from '../types/auth'

const DASHBOARD_PATHS: Record<UserRole, string> = {
  Admin: '/admin',
  Employer: '/employer',
  Candidate: '/candidate',
}

export function dashboardPathFor(role: UserRole): string {
  return DASHBOARD_PATHS[role]
}

/** True when `path` belongs to the area this role may visit. */
export function canVisit(role: UserRole, path: string): boolean {
  const base = DASHBOARD_PATHS[role]
  return path === base || path.startsWith(`${base}/`)
}
