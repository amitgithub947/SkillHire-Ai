import type { ReactNode } from 'react'

interface AlertProps {
  variant?: 'error' | 'success' | 'info'
  children: ReactNode
}

const STYLES = {
  error: 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300',
  success: 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  info: 'border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300',
}

export function Alert({ variant = 'info', children }: AlertProps) {
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${STYLES[variant]}`}>
      {children}
    </div>
  )
}
