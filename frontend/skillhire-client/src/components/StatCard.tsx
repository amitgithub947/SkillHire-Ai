import { Icon, type IconName } from './Icon'

type Tone = 'blue' | 'amber' | 'emerald' | 'red' | 'slate' | 'violet'

const TONES: Record<Tone, string> = {
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
}

interface StatCardProps {
  label: string
  value: number
  tone?: Tone
  icon?: IconName
  /** Short context under the number, e.g. "2 need review". */
  hint?: string
}

export function StatCard({ label, value, tone = 'blue', icon, hint }: StatCardProps) {
  return (
    <div className="card flex items-start justify-between gap-3 p-4 sm:p-5">
      <div className="min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-brand-navy dark:text-slate-100">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
      {icon && (
        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${TONES[tone]}`}>
          <Icon name={icon} className="h-[18px] w-[18px]" />
        </span>
      )}
    </div>
  )
}
