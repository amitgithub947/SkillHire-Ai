import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { dashboardService } from '../services/dashboardService'
import { parseApiError } from '../services/errors'
import type { DashboardInfo } from '../types/api'
import { Alert } from './Alert'
import { PageHeader } from './PageHeader'

export interface DashboardCard {
  title: string
  description: string
}

interface RoleDashboardProps {
  heading: string
  cards: DashboardCard[]
}

/** Placeholder dashboard for roles whose features aren't built yet. */
export function RoleDashboard({ heading, cards }: RoleDashboardProps) {
  const { user } = useAuth()
  const [info, setInfo] = useState<DashboardInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const role = user?.role
  useEffect(() => {
    if (!role) return
    let cancelled = false
    dashboardService
      .get(role)
      .then((data) => !cancelled && setInfo(data))
      .catch((err) => !cancelled && setError(parseApiError(err).message))
    return () => {
      cancelled = true
    }
  }, [role])

  return (
    <>
      <PageHeader title={heading} subtitle={`Hello ${user?.name}, here is your workspace.`} />

      {error && <Alert variant="error">{error}</Alert>}
      {info && <Alert variant="success">Server says: {info.message}</Alert>}
      {!info && !error && <Alert>Checking your access with the server…</Alert>}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-brand-navy">{card.title}</h2>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Coming soon</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{card.description}</p>
          </div>
        ))}
      </div>
    </>
  )
}
