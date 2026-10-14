import type { ReactNode } from 'react'
import { buttonClasses } from './buttonClasses'

interface SubmitButtonProps {
  isLoading: boolean
  loadingText: string
  children: ReactNode
}

/** Full-width primary button for the auth forms. */
export function SubmitButton({ isLoading, loadingText, children }: SubmitButtonProps) {
  return (
    <button type="submit" disabled={isLoading} aria-busy={isLoading || undefined} className={buttonClasses('primary', 'md', 'w-full')}>
      {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
      {isLoading ? loadingText : children}
    </button>
  )
}
