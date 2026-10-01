interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder = 'Search…' }: SearchInputProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm shadow-sm outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/30 sm:w-72"
    />
  )
}
