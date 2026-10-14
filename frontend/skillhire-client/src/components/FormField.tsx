import type { InputHTMLAttributes, ReactNode } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  error?: string
  hint?: string
  /** Shown at the right end of the label row, e.g. a "Forgot password?" link. */
  labelAction?: ReactNode
}

export function FormField({ label, name, error, hint, labelAction, className = '', ...inputProps }: FormFieldProps) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={name} className="field-label">
          {label}
        </label>
        {labelAction && <div className="mb-1.5 text-sm">{labelAction}</div>}
      </div>
      <input
        id={name}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className="field-control h-10"
        {...inputProps}
      />
      {error ? (
        <p id={`${name}-error`} className="field-error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${name}-hint`} className="field-hint">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
