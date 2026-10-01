import type { ReactNode } from 'react'
import { Logo } from './Logo'

const CURRENT_YEAR = new Date().getFullYear()

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-blue via-blue-700 to-brand-violet p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-cyan/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-violet-400/30 blur-3xl" />

        <div className="relative rounded-2xl bg-white/95 p-4 shadow-xl w-fit">
          <Logo className="h-16 w-auto" />
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight">Hire for skills, not just keywords.</h2>
          <p className="mt-4 text-lg text-blue-100">
            SkillHire AI connects employers with the right candidates using resume analysis and smart
            skill matching.
          </p>
        </div>

        <p className="relative text-sm text-blue-100/80">© {CURRENT_YEAR} SkillHire AI</p>
      </aside>

      <main className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo className="h-20 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-brand-navy">{title}</h1>
          <p className="mt-2 text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
