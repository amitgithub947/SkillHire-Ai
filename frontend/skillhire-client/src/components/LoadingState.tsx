/** Spinner with a short label, plus a few placeholder rows so the page doesn't jump when data arrives. */
export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div role="status" aria-live="polite" className="py-6">
      <div className="mb-5 flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-blue dark:border-slate-600 dark:border-t-blue-400" aria-hidden="true" />
        {message}
      </div>
      <div className="space-y-3" aria-hidden="true">
        {[0, 1, 2].map((row) => (
          <div key={row} className="card animate-pulse p-4">
            <div className="h-3.5 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-3 h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800/70" />
          </div>
        ))}
      </div>
    </div>
  )
}
