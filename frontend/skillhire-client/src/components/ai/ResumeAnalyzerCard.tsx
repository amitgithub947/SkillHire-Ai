import { useState, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { aiService } from '../../services/aiService'
import { parseApiError } from '../../services/errors'
import { checkPdf } from '../../utils/ai'
import { Alert } from '../Alert'
import { Button } from '../Button'
import { AiLabel } from './AiLabel'

interface ResumeAnalyzerCardProps {
  /** File name of the saved resume, if any. */
  savedFileName: string | null
}

/** Starts an AI analysis of the saved resume or of another PDF, then opens the results page. */
export function ResumeAnalyzerCard({ savedFileName }: ResumeAnalyzerCardProps) {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState<'saved' | 'file' | null>(null)

  const savedIsPdf = savedFileName?.toLowerCase().endsWith('.pdf') ?? false

  const analyze = async (file?: File) => {
    setError(null)
    setRunning(file ? 'file' : 'saved')
    try {
      await aiService.analyzeResume(file)
      navigate('/candidate/resume/analysis')
    } catch (err) {
      setError(parseApiError(err).message)
      setRunning(null)
    }
  }

  const chooseFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const problem = checkPdf(file)
    if (problem) {
      setError(problem)
      return
    }
    analyze(file)
  }

  return (
    <section className="rounded-xl border border-violet-200 dark:border-violet-500/30 bg-gradient-to-br from-white dark:from-slate-900 to-violet-50/60 dark:to-violet-500/6 p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Resume analyzer</h2>
        <AiLabel />
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        AI reads your PDF resume and lists your skills, technologies, experience, education and projects. Your email,
        phone number and links are removed before anything is sent.
      </p>

      {error && (
        <div className="mt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {running && (
        <p className="mt-4 text-sm text-violet-700 dark:text-violet-300" role="status">
          Analyzing your resume. This usually takes 5 to 20 seconds…
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {savedIsPdf && (
          <Button onClick={() => analyze()} isLoading={running === 'saved'} disabled={running !== null}>
            Analyze my resume
          </Button>
        )}
        <label
          className={`rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition focus-within:ring-2 focus-within:ring-blue-300 ${
            running ? 'pointer-events-none opacity-60' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
        >
          {running === 'file' ? 'Analyzing PDF…' : savedIsPdf ? 'Analyze a different PDF' : 'Choose a PDF to analyze'}
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            disabled={running !== null}
            onChange={chooseFile}
          />
        </label>
        <Link to="/candidate/resume/analysis" className="text-sm font-medium text-brand-blue dark:text-blue-400 hover:underline">
          View last analysis
        </Link>
      </div>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        PDF only, up to 5 MB.
        {savedFileName && !savedIsPdf && ' Your saved resume is not a PDF, so choose a PDF copy to analyze.'}
        {savedIsPdf && ' Analyzing a different PDF does not replace your saved resume.'}
      </p>
    </section>
  )
}
