import { Button } from './Button'
import { Icon } from './Icon'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-500/30 dark:bg-red-500/10"
    >
      <div className="flex gap-3">
        <Icon name="alert" className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
        <div>
          <p className="text-sm font-medium text-red-800 dark:text-red-200">Something went wrong</p>
          <p className="mt-0.5 text-sm text-red-700 dark:text-red-300">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="self-start sm:self-auto">
          Try again
        </Button>
      )}
    </div>
  )
}
