import axios from 'axios'
import { useState, type ReactNode } from 'react'
import { AiLabel } from '../../components/ai/AiLabel'
import { Alert } from '../../components/Alert'
import { Button, ButtonLink } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { SkillTags } from '../../components/SkillTags'
import { useApi } from '../../hooks/useApi'
import { aiService } from '../../services/aiService'
import { candidateService } from '../../services/candidateService'
import { parseApiError } from '../../services/errors'
import type { ResumeAnalysis as Analysis } from '../../types/ai'
import type { CandidateProfile } from '../../types/candidate'
import { newSkills } from '../../utils/ai'
import { formatDateTime } from '../../utils/format'

/** Missing analysis is a normal state here, not an error. */
async function loadAnalysis(): Promise<Analysis | null> {
  try {
    return await aiService.getLatestAnalysis()
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null
    throw err
  }
}

export default function ResumeAnalysis() {
  const analysis = useApi(loadAnalysis)
  const profile = useApi(() => candidateService.getProfile())

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  if (analysis.isLoading || profile.isLoading) return <LoadingState message="Loading your resume analysis…" />
  if (analysis.error || profile.error || !profile.data) {
    const retry = () => {
      analysis.reload()
      profile.reload()
    }
    return <ErrorState message={analysis.error ?? profile.error ?? 'Could not load your analysis.'} onRetry={retry} />
  }

  const me = profile.data
  const canAnalyzeSaved = me.resumeFileName?.toLowerCase().endsWith('.pdf') ?? false

  const analyzeAgain = async () => {
    setIsAnalyzing(true)
    setActionError(null)
    setMessage(null)
    try {
      analysis.setData(await aiService.analyzeResume())
      setMessage('Your resume was analyzed again.')
    } catch (err) {
      setActionError(parseApiError(err).message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const addSkills = async (skills: string[]) => {
    setIsSaving(true)
    setActionError(null)
    setMessage(null)
    try {
      const updated = await candidateService.updateProfile(profileInput(me, [...me.skills, ...skills]))
      profile.setData(updated)
      setMessage(`Added ${skills.length} skill${skills.length === 1 ? '' : 's'} to your profile.`)
    } catch (err) {
      setActionError(parseApiError(err).message)
    } finally {
      setIsSaving(false)
    }
  }

  const header = (
    <PageHeader
      title="Resume analysis"
      subtitle="What AI found in your resume. Check it, then use it to improve your profile."
      actions={
        <ButtonLink to="/candidate/resume" variant="secondary">
          Back to resume
        </ButtonLink>
      }
    />
  )

  const data = analysis.data
  if (!data) {
    return (
      <>
        {header}
        {actionError && (
          <div className="mb-6">
            <Alert variant="error">{actionError}</Alert>
          </div>
        )}
        <EmptyState
          title="No analysis yet"
          message={
            canAnalyzeSaved
              ? 'Let AI read your resume and pull out your skills, experience, education and projects.'
              : 'Upload your resume as a PDF, then analyze it here.'
          }
          action={
            canAnalyzeSaved ? (
              <Button onClick={analyzeAgain} isLoading={isAnalyzing}>
                {isAnalyzing ? 'Analyzing… this can take a few seconds' : 'Analyze my resume'}
              </Button>
            ) : (
              <ButtonLink to="/candidate/resume">Upload a PDF resume</ButtonLink>
            )
          }
        />
      </>
    )
  }

  const toAdd = newSkills([...data.technologies, ...data.skills], me.skills)

  return (
    <>
      {header}

      <div className="space-y-6">
        {message && <Alert variant="success">{message}</Alert>}
        {actionError && <Alert variant="error">{actionError}</Alert>}

        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-brand-navy dark:text-slate-100">Summary</h2>
                <AiLabel />
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {data.resumeFileName ?? 'Resume'} · analyzed {formatDateTime(data.createdAt)}
              </p>
            </div>
            {canAnalyzeSaved && (
              <Button variant="secondary" size="sm" onClick={analyzeAgain} isLoading={isAnalyzing}>
                {isAnalyzing ? 'Analyzing…' : 'Analyze again'}
              </Button>
            )}
          </div>
          <p className="mt-4 leading-relaxed text-slate-700 dark:text-slate-200">{data.summary || 'No summary was produced.'}</p>
          <dl className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 text-sm sm:grid-cols-4">
            <Fact label="Experience" value={data.totalExperienceYears != null ? `${data.totalExperienceYears} years` : '—'} />
            <Fact label="Technologies" value={String(data.technologies.length)} />
            <Fact label="Roles" value={String(data.experience.length)} />
            <Fact label="Projects" value={String(data.projects.length)} />
          </dl>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Technologies">
            {data.technologies.length > 0 ? <SkillTags skills={data.technologies} highlight={me.skills} /> : <None />}
          </Card>
          <Card title="Skills">
            {data.skills.length > 0 ? <SkillTags skills={data.skills} highlight={me.skills} /> : <None />}
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 px-5 py-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {toAdd.length > 0
              ? `${toAdd.length} of these ${toAdd.length === 1 ? 'is' : 'are'} not on your profile yet. Green ones are already there.`
              : 'Every skill found is already on your profile.'}
          </p>
          {toAdd.length > 0 && (
            <Button size="sm" onClick={() => addSkills(toAdd)} isLoading={isSaving}>
              Add {toAdd.length} to my profile
            </Button>
          )}
        </div>

        <Card title="Experience">
          {data.experience.length === 0 ? (
            <None />
          ) : (
            <ol className="space-y-5">
              {data.experience.map((item, i) => (
                <li key={i} className="border-l-2 border-blue-200 dark:border-blue-500/30 pl-4">
                  <p className="font-medium text-brand-navy dark:text-slate-100">{item.role}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {[item.organization, item.duration].filter(Boolean).join(' · ') || '—'}
                  </p>
                  {item.highlights.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                      {item.highlights.map((h, j) => (
                        <li key={j}>{h}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Education">
            {data.education.length === 0 ? (
              <None />
            ) : (
              <ul className="space-y-3">
                {data.education.map((item, i) => (
                  <li key={i}>
                    <p className="font-medium text-brand-navy dark:text-slate-100">{item.degree}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{[item.institution, item.year].filter(Boolean).join(' · ') || '—'}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Projects">
            {data.projects.length === 0 ? (
              <None />
            ) : (
              <ul className="space-y-4">
                {data.projects.map((item, i) => (
                  <li key={i}>
                    <p className="font-medium text-brand-navy dark:text-slate-100">{item.name}</p>
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                    {item.technologies.length > 0 && (
                      <div className="mt-2">
                        <SkillTags skills={item.technologies} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Generated by AI and may contain mistakes. Your email, phone number and links are removed before the resume is
          sent for analysis.
        </p>
      </div>
    </>
  )
}

function profileInput(me: CandidateProfile, skills: string[]) {
  return {
    phone: me.phone,
    location: me.location,
    skills: skills.join(', '),
    experienceYears: me.experienceYears,
    experience: me.experience,
    resumeUrl: me.resumeUrl,
  }
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</h2>
      {children}
    </section>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 font-medium text-slate-800 dark:text-slate-100">{value}</dd>
    </div>
  )
}

function None() {
  return <p className="text-sm text-slate-500 dark:text-slate-400">Nothing found in the resume.</p>
}
