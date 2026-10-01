import { useState } from 'react'
import { Link } from 'react-router-dom'
import { aiService } from '../../services/aiService'
import { parseApiError } from '../../services/errors'
import type { SkillMatch } from '../../types/ai'
import { Alert } from '../Alert'
import { Button } from '../Button'
import { AiLabel } from './AiLabel'
import { MatchScore } from './MatchScore'

/** "How well do I match?" card on the job details page. Runs only when asked, since each check calls the AI service. */
export function SkillMatchPanel({ jobId }: { jobId: number }) {
  const [match, setMatch] = useState<SkillMatch | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const check = async () => {
    setIsChecking(true)
    setError(null)
    try {
      setMatch(await aiService.getSkillMatch(jobId))
    } catch (err) {
      setError(parseApiError(err).message)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm" aria-live="polite">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold text-brand-navy dark:text-slate-100">Skill match</h2>
        <AiLabel />
      </div>

      {!match ? (
        <>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Compare your profile and resume skills with this job to see what you have and what is missing.
          </p>
          {error && (
            <div className="mt-4">
              <Alert variant="error">{error}</Alert>
            </div>
          )}
          <Button variant="secondary" className="mt-4 w-full" onClick={check} isLoading={isChecking}>
            {isChecking ? 'Checking your skills…' : error ? 'Try again' : 'Check my match'}
          </Button>
        </>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-5">
            <MatchScore percent={match.matchPercentage} size="lg" showLabel />
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{match.summary}</p>
          </div>

          <SkillGroup
            title={`You have (${match.matchedSkills.length})`}
            skills={match.matchedSkills}
            empty="None of the listed skills yet."
            tone="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-500/30"
          />
          <SkillGroup
            title={`Missing (${match.missingSkills.length})`}
            skills={match.missingSkills}
            empty="Nothing missing. Nice!"
            tone="bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 ring-amber-200 dark:ring-amber-500/30"
          />

          {!match.usedResumeAnalysis && (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Based on your profile skills only.{' '}
              <Link to="/candidate/resume" className="font-medium text-brand-blue dark:text-blue-400 hover:underline">
                Analyze your resume
              </Link>{' '}
              for a more complete match.
            </p>
          )}
        </>
      )}

      <p className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs text-slate-500 dark:text-slate-400">
        An AI estimate to help you decide. It is not shown to the employer and never decides who gets hired.
      </p>
    </section>
  )
}

interface SkillGroupProps {
  title: string
  skills: string[]
  empty: string
  tone: string
}

function SkillGroup({ title, skills, empty, tone }: SkillGroupProps) {
  return (
    <div className="mt-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</h3>
      {skills.length === 0 ? (
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{empty}</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <li key={skill} className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${tone}`}>
              {skill}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
