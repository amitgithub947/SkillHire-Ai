import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

const CURRENT_YEAR = new Date().getFullYear()

const HIGHLIGHTS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'briefcase', title: 'For recruiters', text: 'Post roles, review applicants and schedule interviews in one place.' },
  { icon: 'search', title: 'For candidates', text: 'Find approved jobs and track every application from applied to offer.' },
  { icon: 'sparkles', title: 'Skill matching', text: 'Resume analysis and match scores based on real skills, not keywords.' },
]

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      <aside className="hidden w-[44%] max-w-xl flex-col justify-between bg-brand-navy p-10 text-slate-300 lg:flex xl:p-12">
        <Logo className="h-12 w-auto self-start" tile />

        <div>
          <h2 className="text-2xl leading-snug font-semibold text-white xl:text-3xl">Hire for skills, not just keywords.</h2>
          <p className="mt-3 max-w-md text-slate-400">
            SkillHire AI helps recruiters and candidates find the right fit, with less back and forth.
          </p>

          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-blue-200">
                  <Icon name={item.icon} className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-0.5 text-sm text-slate-400">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-500">© {CURRENT_YEAR} SkillHire AI</p>
      </aside>

      <main className="relative flex flex-1 flex-col items-center justify-center px-5 py-12 sm:px-8">
        <ThemeToggle className="absolute top-4 right-4 sm:top-6 sm:right-6" />
        <div className="w-full max-w-sm">
          <Logo className="mb-8 h-12 w-auto lg:hidden" />
          <h1 className="text-2xl font-semibold text-brand-navy dark:text-slate-100">{title}</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
