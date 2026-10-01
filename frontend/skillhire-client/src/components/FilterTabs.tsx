export interface FilterTab<T extends string> {
  value: T
  label: string
  count?: number
}

interface FilterTabsProps<T extends string> {
  tabs: FilterTab<T>[]
  value: T
  onChange: (value: T) => void
}

export function FilterTabs<T extends string>({ tabs, value, onChange }: FilterTabsProps<T>) {
  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              active ? 'bg-brand-navy text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`rounded-full px-2 text-xs ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
