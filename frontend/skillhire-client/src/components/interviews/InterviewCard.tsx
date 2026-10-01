import type { ReactNode } from 'react'
import type { Interview, InterviewStatus } from '../../types/interview'
import { formatDateTime } from '../../utils/format'
import { INTERVIEW_TYPE_LABELS } from '../../utils/labels'

const STATUS_STYLES: Record<InterviewStatus, string> = {
  Scheduled: 'bg-blue-100 text-blue-800',
  Completed: 'bg-emerald-100 text-emerald-800',
  Cancelled: 'bg-slate-200 text-slate-600',
}

interface InterviewCardProps {
  interview: Interview
  /** Candidate views show the job and company; employer views show the candidate. */
  perspective: 'candidate' | 'employer'
  actions?: ReactNode
}

export function InterviewCard({ interview, perspective, actions }: InterviewCardProps) {
  const isUpcoming = interview.status === 'Scheduled'
  const date = new Date(interview.interviewDate)

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
      <div
        className={`flex w-full shrink-0 flex-row items-center justify-center gap-3 rounded-lg px-4 py-3 text-center sm:w-24 sm:flex-col sm:gap-0 ${
          isUpcoming ? 'bg-blue-50 text-brand-blue' : 'bg-slate-100 text-slate-500'
        }`}
      >
        <span className="text-xs font-semibold uppercase">{date.toLocaleDateString('en-GB', { month: 'short' })}</span>
        <span className="text-2xl font-bold leading-tight">{date.getDate()}</span>
        <span className="text-xs">{date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-brand-navy">
            {perspective === 'candidate' ? interview.jobTitle : interview.candidateName}
          </h3>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[interview.status]}`}>
            {interview.status}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-slate-500">
          {perspective === 'candidate' ? interview.companyName : interview.jobTitle} · {INTERVIEW_TYPE_LABELS[interview.type]}
        </p>
        <p className="mt-2 text-sm text-slate-700">{formatDateTime(interview.interviewDate)}</p>

        {interview.meetingLink && (
          <p className="mt-2 truncate text-sm">
            <span className="text-slate-500">Meeting link: </span>
            <a
              href={interview.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand-blue hover:underline"
            >
              {interview.meetingLink}
            </a>
          </p>
        )}
        {interview.notes && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{interview.notes}</p>}
        {interview.feedback && (
          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <span className="font-semibold">Feedback:</span> {interview.feedback}
          </div>
        )}
      </div>

      {actions && <div className="flex shrink-0 flex-wrap items-start gap-2 sm:flex-col">{actions}</div>}
    </article>
  )
}
