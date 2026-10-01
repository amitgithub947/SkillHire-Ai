import type { ReactNode } from 'react'

interface AlertProps {
  variant?: 'error' | 'success' | 'info'
  children: ReactNode
}

const STYLES = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
}

export function Alert({ variant = 'info', children }: AlertProps) {
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${STYLES[variant]}`}>
      {children}
    </div>
  )
}
