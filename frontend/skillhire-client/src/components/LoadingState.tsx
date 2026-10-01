export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400" role="status">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-brand-blue" />
      {message}
    </div>
  )
}
