import type { ReactNode } from 'react'

export interface BreakdownItem {
  label: string
  value: number
  /** Tailwind background class for the bar segment and legend dot. */
  color: string
}

interface StatusBreakdownProps {
  title: string
  items: BreakdownItem[]
  /** Link or button shown next to the title. */
  action?: ReactNode
  emptyText?: string
}

/** A single stacked bar with a legend, for showing how a total splits across statuses. */
export function StatusBreakdown({ title, items, action, emptyText = 'Nothing to show yet.' }: StatusBreakdownProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0)

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-title">{title}</h2>
        {action}
      </div>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-brand-navy tabular-nums dark:text-slate-100">{total}</span> in total
      </p>

      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
        {total > 0 &&
          items
            .filter((item) => item.value > 0)
            .map((item) => <span key={item.label} className={item.color} style={{ width: `${(item.value / total) * 100}%` }} />)}
      </div>

      {total === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
      ) : (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item) => (
            <div key={item.label}>
              <dt className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className={`h-2 w-2 rounded-full ${item.color}`} aria-hidden="true" />
                {item.label}
              </dt>
              <dd className="mt-0.5 pl-4 text-lg font-semibold text-brand-navy tabular-nums dark:text-slate-100">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
