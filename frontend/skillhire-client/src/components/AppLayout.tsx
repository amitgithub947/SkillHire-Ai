import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import type { User, UserRole } from '../types/auth'
import { Icon, type IconName } from './Icon'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

interface NavItem {
  to: string
  label: string
  icon: IconName
  /** Only highlight on an exact match (so /recruiter doesn't stay active on /recruiter/jobs). */
  end?: boolean
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  Admin: [
    { to: '/admin', label: 'Overview', icon: 'dashboard', end: true },
    { to: '/admin/jobs', label: 'Job reviews', icon: 'clipboard' },
    { to: '/admin/users', label: 'Users', icon: 'users' },
  ],
  Recruiter: [
    { to: '/recruiter', label: 'Dashboard', icon: 'dashboard', end: true },
    { to: '/recruiter/jobs', label: 'My jobs', icon: 'briefcase', end: true },
    { to: '/recruiter/jobs/new', label: 'Post a job', icon: 'plus' },
    { to: '/recruiter/applications', label: 'Applicants', icon: 'inbox' },
    { to: '/recruiter/profile', label: 'Company profile', icon: 'building' },
  ],
  Candidate: [
    { to: '/candidate', label: 'Dashboard', icon: 'dashboard', end: true },
    { to: '/candidate/jobs', label: 'Find jobs', icon: 'search' },
    { to: '/candidate/applications', label: 'My applications', icon: 'briefcase' },
    { to: '/candidate/interviews', label: 'Interviews', icon: 'calendar' },
    { to: '/candidate/profile', label: 'Profile', icon: 'user' },
    { to: '/candidate/resume', label: 'Resume', icon: 'file' },
  ],
}

interface RoleTheme {
  workspace: string
  sidebar: string
  divider: string
  item: string
  itemActive: string
  marker: string
  muted: string
  strong: string
  avatar: string
  footerButton: string
}

// The admin console uses a dark sidebar; recruiter and candidate workspaces use light ones
// with their own accent, so it's obvious at a glance which area you're in.
const ROLE_THEME: Record<UserRole, RoleTheme> = {
  Admin: {
    workspace: 'Admin console',
    sidebar: 'bg-brand-navy text-slate-300 dark:bg-slate-900 dark:border-r dark:border-slate-800',
    divider: 'border-white/10 dark:border-slate-800',
    item: 'text-slate-300 hover:bg-white/5 hover:text-white',
    itemActive: 'bg-white/10 text-white',
    marker: 'bg-rose-400',
    muted: 'text-slate-400',
    strong: 'text-white',
    avatar: 'bg-rose-500/20 text-rose-200',
    footerButton: 'text-slate-300 hover:bg-white/5 hover:text-white',
  },
  Recruiter: {
    workspace: 'Recruiter workspace',
    sidebar: 'border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
    divider: 'border-slate-200 dark:border-slate-800',
    item: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100',
    itemActive: 'bg-blue-50 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200',
    marker: 'bg-blue-600 dark:bg-blue-400',
    muted: 'text-slate-500 dark:text-slate-400',
    strong: 'text-brand-navy dark:text-slate-100',
    avatar: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200',
    footerButton: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
  },
  Candidate: {
    workspace: 'Candidate',
    sidebar: 'border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
    divider: 'border-slate-200 dark:border-slate-800',
    item: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100',
    itemActive: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200',
    marker: 'bg-emerald-600 dark:bg-emerald-400',
    muted: 'text-slate-500 dark:text-slate-400',
    strong: 'text-brand-navy dark:text-slate-100',
    avatar: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
    footerButton: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
  },
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('') || '?'
  )
}

interface SidebarProps {
  user: User
  onLogout: () => void
}

function Sidebar({ user, onLogout }: SidebarProps) {
  const theme = ROLE_THEME[user.role]

  return (
    <div className={`flex h-full flex-col ${theme.sidebar}`}>
      <div className={`flex h-16 items-center gap-3 border-b px-5 ${theme.divider}`}>
        <Logo className="h-11 w-auto" tile={user.role === 'Admin'} />
      </div>

      <p className={`px-5 pt-5 pb-2 text-xs font-medium tracking-wide uppercase ${theme.muted}`}>{theme.workspace}</p>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Main">
        {NAV_ITEMS[user.role].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${isActive ? theme.itemActive : theme.item}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className={`absolute inset-y-2 left-0 w-0.5 rounded-full ${theme.marker}`} aria-hidden="true" />}
                <Icon name={item.icon} className="h-[18px] w-[18px]" />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={`border-t p-3 ${theme.divider}`}>
        <div className="flex items-center gap-3 px-2 py-2">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${theme.avatar}`} aria-hidden="true">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm font-medium ${theme.strong}`}>{user.name}</p>
            <p className={`truncate text-xs ${theme.muted}`}>{user.email}</p>
          </div>
          <ThemeToggle onDark={user.role === 'Admin'} />
        </div>
        <button
          type="button"
          onClick={onLogout}
          className={`mt-1 flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${theme.footerButton}`}
        >
          <Icon name="logout" className="h-[18px] w-[18px]" />
          Log out
        </button>
      </div>
    </div>
  )
}

/** Sidebar navigation on large screens, a top bar with a slide-in menu on tablets and phones. */
export function AppLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  // The menu belongs to the page it was opened on, so following a link closes it.
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const menuOpen = menuPath === pathname
  const setMenuOpen = (open: boolean) => setMenuPath(open ? pathname : null)

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setMenuPath(null)
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  if (!user) return null
  const theme = ROLE_THEME[user.role]

  return (
    <div className="min-h-screen lg:pl-64">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-white px-3 py-2 text-sm font-medium text-brand-navy shadow focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar user={user} onLogout={logout} />
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 lg:hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Icon name="menu" />
          </button>
          <Logo className="h-8 w-auto" />
        </div>
        <span className={`hidden text-xs font-medium sm:inline ${theme.muted}`}>{theme.workspace}</span>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" id="mobile-menu">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-label="Menu" className="relative h-full w-72 max-w-[85vw] shadow-xl">
            <Sidebar user={user} onLogout={logout} />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              autoFocus
              className={`absolute top-3.5 right-3 inline-flex h-9 w-9 items-center justify-center rounded-md ${theme.footerButton}`}
            >
              <Icon name="close" />
            </button>
          </div>
        </div>
      )}

      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 focus:outline-none sm:px-6 lg:px-10 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
