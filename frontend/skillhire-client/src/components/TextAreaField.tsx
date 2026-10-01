import type { TextareaHTMLAttributes } from 'react'

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  name: string
  error?: string
  hint?: string
}

export function TextAreaField({ label, name, error, hint, className = '', ...rest }: TextAreaFieldProps) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined

  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`block w-full rounded-lg border bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-slate-100 shadow-sm outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-500/30'
            : 'border-slate-300 dark:border-slate-600 focus:border-brand-blue focus:ring-blue-100 dark:focus:ring-blue-500/30'
        }`}
        {...rest}
      />
      {error ? (
        <p id={`${name}-error`} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${name}-hint`} className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
