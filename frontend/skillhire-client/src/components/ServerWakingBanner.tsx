import { useSyncExternalStore } from 'react'
import { serverStatus } from '../services/serverStatus'

/** Shown while a request takes more than a few seconds, usually because the server was asleep. */
export function ServerWakingBanner() {
  const isSlow = useSyncExternalStore(serverStatus.subscribe, serverStatus.isSlow)
  if (!isSlow) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
    >
      <span className="mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400 dark:border-t-transparent" aria-hidden="true" />
      <p>
        <span className="font-medium text-brand-navy dark:text-slate-100">Waking up the server…</span> After a quiet
        period the first request can take up to a minute. Please keep this page open.
      </p>
    </div>
  )
}
