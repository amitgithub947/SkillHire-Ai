import type { ReactNode } from 'react'

interface SubmitButtonProps {
  isLoading: boolean
  loadingText: string
  children: ReactNode
}

export function SubmitButton({ isLoading, loadingText, children }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-blue to-brand-violet px-4 py-2.5 font-semibold text-white shadow-md transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {isLoading ? loadingText : children}
    </button>
  )
}
