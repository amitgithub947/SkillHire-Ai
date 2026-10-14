import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

interface EmptyStateProps {
  title: string
  message?: string
  action?: ReactNode
  icon?: IconName
}

export function EmptyState({ title, message, action, icon = 'inbox' }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Icon name={icon} />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-brand-navy dark:text-slate-100">{title}</h3>
      {message && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{message}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
