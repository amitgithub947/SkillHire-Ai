import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { useApi } from '../../hooks/useApi'
import { candidateService } from '../../services/candidateService'
import { ResumePreviewModal } from '../../components/ResumePreviewModal'
import { parseApiError } from '../../services/errors'
import { formatDate, formatFileSize } from '../../utils/format'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx']

function checkFile(file: File): string | null {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(extension)) return 'Only PDF, DOC and DOCX files are allowed.'
  if (file.size === 0) return 'The selected file is empty.'
  if (file.size > MAX_BYTES) return `This file is ${formatFileSize(file.size)}. The limit is 5 MB.`
  return null
}

export default function ResumeUpload() {
  const { data: profile, setData, error, isLoading, reload } = useApi(() => candidateService.getProfile())
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)

  if (isLoading) return <LoadingState message="Loading your resume…" />
  if (error || !profile) return <ErrorState message={error ?? 'Could not load your resume.'} onRetry={reload} />

  const choose = (selected: File | undefined) => {
    setMessage(null)
    setActionError(null)
    if (!selected) return
    const problem = checkFile(selected)
    setFileError(problem)
    setFile(problem ? null : selected)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    choose(e.dataTransfer.files[0])
  }

  const upload = async () => {
    if (!file) return
    setProgress(0)
    setActionError(null)
    try {
      const updated = await candidateService.uploadResume(file, setProgress)
      setData(updated)
      setMessage(`"${updated.resumeFileName}" uploaded. Employers will see it when you apply.`)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setActionError(parseApiError(err).message)
    } finally {
      setProgress(null)
    }
  }

  const remove = async () => {
    setIsDeleting(true)
    setActionError(null)
    try {
      setData(await candidateService.deleteResume())
      setMessage('Resume deleted.')
      setConfirmDelete(false)
    } catch (err) {
      setActionError(parseApiError(err).message)
      setConfirmDelete(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const isUploading = progress !== null

  return (
    <>
      <PageHeader title="Resume" subtitle="Upload the resume employers will see when you apply." />

      <div className="max-w-3xl space-y-6">
        {message && <Alert variant="success">{message}</Alert>}
        {actionError && <Alert variant="error">{actionError}</Alert>}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Current resume</h2>
          {profile.resumeFileName ? (
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-xs font-bold text-red-600">
                {profile.resumeFileName.split('.').pop()?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-all font-medium text-brand-navy">{profile.resumeFileName}</p>
                <p className="text-sm text-slate-500">Uploaded {formatDate(profile.resumeUploadedAt)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsPreviewing(true)}>
                  View
                </Button>
                <Button variant="dangerOutline" size="sm" onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              {profile.resumeUrl ? (
                <>
                  No file uploaded. You are using a resume link:{' '}
                  <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="break-all text-brand-blue hover:underline">
                    {profile.resumeUrl}
                  </a>
                </>
              ) : (
                'You have not uploaded a resume yet. You need one (or a resume link) to apply for jobs.'
              )}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {profile.resumeFileName ? 'Replace resume' : 'Upload resume'}
          </h2>

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
              isDragging ? 'border-brand-blue bg-blue-50' : fileError ? 'border-red-300 bg-red-50/40' : 'border-slate-300'
            }`}
          >
            <p className="font-medium text-brand-navy">Drag and drop your resume here</p>
            <p className="mt-1 text-sm text-slate-500">PDF, DOC or DOCX, up to 5 MB</p>
            <label className="mt-4 cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-within:ring-2 focus-within:ring-blue-300">
              Choose file
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(e: ChangeEvent<HTMLInputElement>) => choose(e.target.files?.[0])}
              />
            </label>
          </div>

          {fileError && <p className="mt-3 text-sm text-red-600">{fileError}</p>}

          {file && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
              <p className="min-w-0 break-all text-sm">
                <span className="font-medium text-slate-800">{file.name}</span>{' '}
                <span className="text-slate-500">({formatFileSize(file.size)})</span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => {
                    setFile(null)
                    if (inputRef.current) inputRef.current.value = ''
                  }}
                >
                  Remove
                </Button>
                <Button size="sm" onClick={upload} isLoading={isUploading}>
                  Upload
                </Button>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="mt-4" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-brand-blue transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-500">Uploading… {progress}%</p>
            </div>
          )}

          <p className="mt-5 text-sm text-slate-500">
            Prefer a link (Google Drive, Dropbox)? Add it on your{' '}
            <Link to="/candidate/profile" className="font-medium text-brand-blue hover:underline">
              profile
            </Link>
            .
          </p>
        </section>
      </div>

      {isPreviewing && (
        <ResumePreviewModal
          title={profile.resumeFileName ?? 'Resume'}
          load={() => candidateService.downloadResume(profile.resumeFileName ?? 'resume')}
          onClose={() => setIsPreviewing(false)}
        />
      )}

      {confirmDelete && (
        <Modal
          title="Delete resume?"
          onClose={() => !isDeleting && setConfirmDelete(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmDelete(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={remove} isLoading={isDeleting}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Employers you already applied to will no longer be able to open this file. You will need a resume to apply for
            new jobs.
          </p>
        </Modal>
      )}
    </>
  )
}
