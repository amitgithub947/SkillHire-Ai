type Tone = 'blue' | 'amber' | 'emerald' | 'red' | 'slate' | 'violet'

const TONES: Record<Tone, string> = {
  blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  red: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300',
  slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200',
  violet: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300',
}

interface StatCardProps {
  label: string
  value: number
  tone?: Tone
}

export function StatCard({ label, value, tone = 'blue' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-3 inline-flex min-w-12 justify-center rounded-lg px-3 py-1 text-2xl font-bold ${TONES[tone]}`}>
        {value}
      </p>
    </div>
  )
}
