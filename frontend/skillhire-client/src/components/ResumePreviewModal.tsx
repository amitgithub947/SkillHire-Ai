import { useEffect, useMemo } from 'react'
import { useApi } from '../hooks/useApi'
import type { DownloadedFile } from '../services/fileService'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import { Modal } from './Modal'

interface ResumePreviewModalProps {
  title: string
  load: () => Promise<DownloadedFile>
  onClose: () => void
}

/** Shows a protected resume inside the page: PDFs are previewed, other formats offer a download. */
export function ResumePreviewModal({ title, load, onClose }: ResumePreviewModalProps) {
  const { data, error, isLoading, reload } = useApi(load)
  const url = useMemo(() => (data ? URL.createObjectURL(data.blob) : null), [data])

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  const isPdf = data?.blob.type === 'application/pdf'

  return (
    <Modal
      title={title}
      size="xl"
      onClose={onClose}
      footer={
        url &&
        data && (
          <a
            href={url}
            download={data.fileName}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            Download {data.fileName}
          </a>
        )
      }
    >
      {isLoading ? (
        <LoadingState message="Loading resume…" />
      ) : error || !url ? (
        <ErrorState message={error ?? 'Could not load the resume.'} onRetry={reload} />
      ) : isPdf ? (
        <iframe src={url} title={title} className="h-[70vh] w-full rounded-lg border border-slate-200 dark:border-slate-800" />
      ) : (
        <p className="py-10 text-center text-sm text-slate-600 dark:text-slate-300">
          Word documents can't be previewed in the browser. Use the download button below to open it.
        </p>
      )}
    </Modal>
  )
}
