import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import type { UserRole } from '../types/auth'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

interface NavItem {
  to: string
  label: string
  /** Only highlight on an exact match (so /employer doesn't stay active on /employer/jobs). */
  end?: boolean
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  Admin: [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/jobs', label: 'Manage jobs' },
    { to: '/admin/users', label: 'Manage users' },
  ],
  Employer: [
    { to: '/employer', label: 'Dashboard', end: true },
    { to: '/employer/jobs', label: 'My jobs', end: true },
    { to: '/employer/jobs/new', label: 'Post a job' },
    { to: '/employer/applications', label: 'Applications' },
    { to: '/employer/profile', label: 'Company profile' },
  ],
  Candidate: [
    { to: '/candidate', label: 'Dashboard', end: true },
    { to: '/candidate/jobs', label: 'Find jobs' },
    { to: '/candidate/applications', label: 'My applications' },
    { to: '/candidate/interviews', label: 'Interviews' },
    { to: '/candidate/profile', label: 'Profile' },
    { to: '/candidate/resume', label: 'Resume' },
  ],
}

const ROLE_BADGE: Record<UserRole, string> = {
  Admin: 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300',
  Employer: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300',
  Candidate: 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300',
}

/** Header + role-based navigation shared by every logged-in page. */
export function AppLayout() {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo className="h-11 w-auto" />

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-brand-navy dark:text-slate-100">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ROLE_BADGE[user.role]}`}>{user.role}</span>
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Main">
          {NAV_ITEMS[user.role].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'border-brand-blue text-brand-blue dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-200'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}
