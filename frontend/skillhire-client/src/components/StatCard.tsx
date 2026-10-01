type Tone = 'blue' | 'amber' | 'emerald' | 'red' | 'slate' | 'violet'

const TONES: Record<Tone, string> = {
  blue: 'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-700',
  slate: 'bg-slate-100 text-slate-700',
  violet: 'bg-violet-50 text-violet-700',
}

interface StatCardProps {
  label: string
  value: number
  tone?: Tone
}

export function StatCard({ label, value, tone = 'blue' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-3 inline-flex min-w-12 justify-center rounded-lg px-3 py-1 text-2xl font-bold ${TONES[tone]}`}>
        {value}
      </p>
    </div>
  )
}
