import { Link } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { aiService } from '../../services/aiService'
import type { JobMatch } from '../../types/ai'
import { formatExperience } from '../../utils/format'
import { Button, ButtonLink } from '../Button'
import { CompanyLogo } from '../CompanyLogo'
import { EmptyState } from '../EmptyState'
import { AiLabel } from './AiLabel'
import { MatchScore } from './MatchScore'

/** "Recommended for you" on the candidate dashboard. Loads separately so a slow AI call never blocks the page. */
export function RecommendedJobs() {
  const { data, error, isLoading, reload } = useApi(() => aiService.getJobMatches(4))

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-brand-navy dark:text-slate-100">Recommended for you</h2>
        <AiLabel />
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2" aria-busy="true">
          <p className="sr-only">Finding jobs that match your skills…</p>
          {[0, 1].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
              <div className="mt-3 h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
              <div className="mt-6 h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-8 text-center shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-300">{error}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <ButtonLink to="/candidate/profile" variant="secondary" size="sm">
              Update skills
            </ButtonLink>
            <ButtonLink to="/candidate/resume" variant="secondary" size="sm">
              Analyze resume
            </ButtonLink>
            <Button variant="ghost" size="sm" onClick={reload}>
              Try again
            </Button>
          </div>
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No strong matches right now"
          message="Add more skills to your profile or analyze your resume, and check back as new jobs are posted."
          action={<ButtonLink to="/candidate/jobs" variant="secondary">Browse all jobs</ButtonLink>}
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {data.map((match) => (
              <JobMatchCard key={match.job.id} match={match} />
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Ranked by AI from your profile and resume skills. Use it as a guide; always read the full job description.
          </p>
        </>
      )}
    </section>
  )
}

function JobMatchCard({ match }: { match: JobMatch }) {
  const { job } = match

  return (
    <Link
      to={`/candidate/jobs/${job.id}`}
      className="group flex gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
    >
      <CompanyLogo name={job.companyName} logoUrl={job.companyLogoUrl} />
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-brand-navy dark:text-slate-100 group-hover:text-brand-blue dark:group-hover:text-blue-400">{job.title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {job.companyName} · {job.location ?? 'Location not set'} · {formatExperience(job.experienceRequired)}
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{match.reason}</p>
        {match.matchedSkills.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {match.matchedSkills.map((skill) => (
              <li key={skill} className="rounded-md bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-500/30">
                {skill}
              </li>
            ))}
          </ul>
        )}
      </div>
      <MatchScore percent={match.matchPercentage} />
    </Link>
  )
}
