import type { ReactNode } from 'react'
import type { Interview, InterviewStatus } from '../../types/interview'
import { formatDateTime } from '../../utils/format'
import { INTERVIEW_TYPE_LABELS } from '../../utils/labels'

const STATUS_STYLES: Record<InterviewStatus, string> = {
  Scheduled: 'bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/25',
  Completed: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/25',
  Cancelled: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/15 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-500/30',
}

interface InterviewCardProps {
  interview: Interview
  /** Candidate views show the job and company; recruiter views show the candidate. */
  perspective: 'candidate' | 'recruiter'
  actions?: ReactNode
}

export function InterviewCard({ interview, perspective, actions }: InterviewCardProps) {
  const isUpcoming = interview.status === 'Scheduled'
  const date = new Date(interview.interviewDate)

  return (
    <article className="flex flex-col gap-4 card p-5 sm:flex-row">
      <div
        className={`flex w-full shrink-0 flex-row items-center justify-center gap-3 rounded-lg px-4 py-3 text-center sm:w-24 sm:flex-col sm:gap-0 ${
          isUpcoming ? 'bg-blue-50 dark:bg-blue-500/10 text-brand-blue dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
        }`}
      >
        <span className="text-xs font-semibold uppercase">{date.toLocaleDateString('en-GB', { month: 'short' })}</span>
        <span className="text-2xl font-semibold leading-tight">{date.getDate()}</span>
        <span className="text-xs">{date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-brand-navy dark:text-slate-100">
            {perspective === 'candidate' ? interview.jobTitle : interview.candidateName}
          </h3>
          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[interview.status]}`}>
            {interview.status}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          {perspective === 'candidate' ? interview.companyName : interview.jobTitle} · {INTERVIEW_TYPE_LABELS[interview.type]}
        </p>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{formatDateTime(interview.interviewDate)}</p>

        {interview.meetingLink && (
          <p className="mt-2 truncate text-sm">
            <span className="text-slate-500 dark:text-slate-400">Meeting link: </span>
            <a
              href={interview.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="link"
            >
              {interview.meetingLink}
            </a>
          </p>
        )}
        {interview.notes && <p className="mt-2 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{interview.notes}</p>}
        {interview.feedback && (
          <div className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 text-sm text-slate-700 dark:text-slate-200">
            <span className="font-medium">Feedback:</span> {interview.feedback}
          </div>
        )}
      </div>

      {actions && <div className="flex shrink-0 flex-wrap items-start gap-2 sm:flex-col">{actions}</div>}
    </article>
  )
}
