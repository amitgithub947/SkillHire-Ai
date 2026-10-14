import { useState, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { aiService } from '../../services/aiService'
import { parseApiError } from '../../services/errors'
import { checkPdf } from '../../utils/ai'
import { Alert } from '../Alert'
import { Button } from '../Button'
import { buttonClasses } from '../buttonClasses'
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
    <section className="card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <h2 className="section-title">Resume analyzer</h2>
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
        <p className="mt-4 flex items-center gap-2 text-sm text-violet-700 dark:text-violet-300" role="status">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
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
          className={buttonClasses(
            'secondary',
            'md',
            `focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600 ${running ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`,
          )}
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
        <Link to="/candidate/resume/analysis" className="link text-sm">
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
