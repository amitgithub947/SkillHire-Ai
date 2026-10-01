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

const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

export function formatDate(value: string | null): string {
  return value ? dateFormat.format(new Date(value)) : '—'
}

/** e.g. "Mon, 5 Oct 2026, 10:30 am" in the user's local time zone. */
export function formatDateTime(value: string | null): string {
  return value ? dateTimeFormat.format(new Date(value)) : '—'
}

/** Splits "C#, React" into ["C#", "React"], ignoring blanks. */
export function parseSkills(value: string | null): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Empty strings become null so optional fields aren't sent as "". */
export function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}
