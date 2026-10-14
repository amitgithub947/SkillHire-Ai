import { Button } from './Button'
import { Icon } from './Icon'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-800" aria-label="Pagination">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <Icon name="arrowLeft" className="h-4 w-4" />
        Previous
      </Button>
      <span className="text-sm text-slate-500 dark:text-slate-400" aria-current="page">
        Page <span className="font-medium text-slate-800 dark:text-slate-200">{page}</span> of {totalPages}
      </span>
      <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
        <Icon name="arrowRight" className="h-4 w-4" />
      </Button>
    </nav>
  )
}
