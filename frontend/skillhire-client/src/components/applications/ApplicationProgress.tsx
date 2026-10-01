import type { ApplicationStatus } from '../../types/application'

interface Step {
  label: string
  state: 'done' | 'current' | 'upcoming' | 'rejected'
}

function buildSteps(status: ApplicationStatus, hadInterview: boolean): Step[] {
  const reached: Record<ApplicationStatus, number> = {
    Applied: 0,
    Shortlisted: 1,
    InterviewScheduled: 2,
    Selected: 3,
    Rejected: hadInterview ? 2 : 0,
  }
  const index = reached[status]
  const labels = ['Applied', 'Shortlisted', 'Interview', status === 'Rejected' ? 'Not selected' : 'Selected']

  return labels.map((label, i) => {
    if (status === 'Rejected') {
      if (i === 3) return { label, state: 'rejected' }
      return { label, state: i <= index ? 'done' : 'upcoming' }
    }
    if (status === 'Selected') return { label, state: 'done' }
    if (i < index) return { label, state: 'done' }
    if (i === index) return { label, state: 'current' }
    return { label, state: 'upcoming' }
  })
}

const DOT: Record<Step['state'], string> = {
  done: 'bg-emerald-500 text-white',
  current: 'bg-brand-blue text-white ring-4 ring-blue-100 dark:ring-blue-500/30',
  upcoming: 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
  rejected: 'bg-red-500 text-white',
}

const LABEL: Record<Step['state'], string> = {
  done: 'text-slate-700 dark:text-slate-200',
  current: 'font-semibold text-brand-blue dark:text-blue-400',
  upcoming: 'text-slate-400',
  rejected: 'font-semibold text-red-600 dark:text-red-400',
}

/** Horizontal tracker: Applied → Shortlisted → Interview → Selected / Not selected. */
export function ApplicationProgress({ status, hadInterview = false }: { status: ApplicationStatus; hadInterview?: boolean }) {
  const steps = buildSteps(status, hadInterview)

  return (
    <ol className="flex items-start" aria-label="Application progress">
      {steps.map((step, i) => (
        <li key={step.label} className="relative flex flex-1 flex-col items-center text-center">
          {i > 0 && (
            <span
              aria-hidden="true"
              className={`absolute top-3.5 right-1/2 h-0.5 w-full -translate-y-1/2 ${
                step.state === 'upcoming' ? 'bg-slate-200 dark:bg-slate-700' : step.state === 'rejected' ? 'bg-red-200 dark:bg-red-500/25' : 'bg-emerald-300'
              }`}
            />
          )}
          <span
            className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${DOT[step.state]}`}
          >
            {step.state === 'done' ? '✓' : step.state === 'rejected' ? '✕' : i + 1}
          </span>
          <span className={`mt-2 text-xs ${LABEL[step.state]}`}>{step.label}</span>
        </li>
      ))}
    </ol>
  )
}
