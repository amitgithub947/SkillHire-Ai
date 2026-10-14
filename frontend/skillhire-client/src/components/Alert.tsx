import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

interface AlertProps {
  variant?: 'error' | 'success' | 'info' | 'warning'
  title?: string
  children: ReactNode
}

const STYLES = {
  error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
}

const ICONS: Record<keyof typeof STYLES, IconName> = {
  error: 'alert',
  success: 'checkCircle',
  info: 'info',
  warning: 'alert',
}

export function Alert({ variant = 'info', title, children }: AlertProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-md border px-3.5 py-3 text-sm ${STYLES[variant]}`}
    >
      <Icon name={ICONS[variant]} className="mt-0.5 h-4 w-4" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        <div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div>
      </div>
    </div>
  )
}
