import type { InputHTMLAttributes, ReactNode } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  error?: string
  /** Shown at the right end of the label row, e.g. a "Forgot password?" link. */
  labelAction?: ReactNode
}

export function FormField({ label, name, error, labelAction, className = '', ...inputProps }: FormFieldProps) {
  const errorId = `${name}-error`

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </label>
        {labelAction}
      </div>
      <input
        id={name}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`block w-full rounded-lg border bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-slate-100 shadow-sm outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-500/30'
            : 'border-slate-300 dark:border-slate-600 focus:border-brand-blue focus:ring-blue-100 dark:focus:ring-blue-500/30'
        }`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
