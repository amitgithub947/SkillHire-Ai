export interface MatchTier {
  label: string
  /** Tailwind classes for the ring colour and the text. */
  ring: string
  text: string
}

export function matchTier(percent: number): MatchTier {
  if (percent >= 75) return { label: 'Strong match', ring: 'stroke-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' }
  if (percent >= 50) return { label: 'Good match', ring: 'stroke-blue-500', text: 'text-blue-700 dark:text-blue-300' }
  if (percent >= 30) return { label: 'Partial match', ring: 'stroke-amber-500', text: 'text-amber-700 dark:text-amber-300' }
  return { label: 'Low match', ring: 'stroke-slate-400', text: 'text-slate-600 dark:text-slate-300' }
}

/** Skills in `found` that are not already in `existing` (case-insensitive). */
export function newSkills(found: string[], existing: string[]): string[] {
  const known = new Set(existing.map((s) => s.toLowerCase()))
  const result: string[] = []
  for (const skill of found) {
    const key = skill.toLowerCase()
    if (!known.has(key)) {
      known.add(key)
      result.push(skill)
    }
  }
  return result
}

export const AI_PDF_MAX_BYTES = 5 * 1024 * 1024

export function checkPdf(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.pdf')) return 'Only PDF files can be analyzed.'
  if (file.size === 0) return 'The selected file is empty.'
  if (file.size > AI_PDF_MAX_BYTES) return 'The PDF must be 5 MB or smaller.'
  return null
}
