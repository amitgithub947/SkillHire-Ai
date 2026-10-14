import { useState } from 'react'

interface CompanyLogoProps {
  name: string
  logoUrl: string | null
  size?: 'sm' | 'lg'
}

/** Shows the company logo, falling back to initials if there is no URL or it fails to load. */
export function CompanyLogo({ name, logoUrl, size = 'sm' }: CompanyLogoProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const dimensions = size === 'lg' ? 'h-16 w-16 text-xl' : 'h-10 w-10 text-sm'
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')

  if (logoUrl && failedUrl !== logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        onError={() => setFailedUrl(logoUrl)}
        className={`${dimensions} shrink-0 rounded-md border border-slate-200 bg-white object-contain p-1 dark:border-slate-700 dark:bg-slate-900`}
      />
    )
  }

  return (
    <div
      aria-hidden="true"
      className={`${dimensions} flex shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300`}
    >
      {initials || '?'}
    </div>
  )
}
