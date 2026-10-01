import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  message?: string
  action?: ReactNode
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-6 py-14 text-center">
      <h3 className="font-semibold text-brand-navy dark:text-slate-100">{title}</h3>
      {message && <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">{message}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
