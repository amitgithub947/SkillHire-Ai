const numberFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export function formatSalary(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${numberFormat.format(min)} – ${numberFormat.format(max)}`
  if (min != null) return `From ${numberFormat.format(min)}`
  if (max != null) return `Up to ${numberFormat.format(max)}`
  return 'Not disclosed'
}

export function formatExperience(years: number): string {
  if (years === 0) return 'Fresher'
  return `${years}+ year${years === 1 ? '' : 's'}`
}

export function formatDate(value: string | null): string {
  return value ? dateFormat.format(new Date(value)) : '—'
}

/** Empty strings become null so optional fields aren't sent as "". */
export function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}
