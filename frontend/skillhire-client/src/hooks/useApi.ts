import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { parseApiError } from '../services/errors'

interface Result<T> {
  requestKey: string
  data: T | null
  error: string | null
}

type Updater<T> = T | null | ((prev: T | null) => T | null)

/**
 * Loads data on mount and again whenever `key` changes or `reload()` is called.
 * `setData` lets a page patch the result after a mutation without refetching.
 */
export function useApi<T>(fetcher: () => Promise<T>, key: string | number = '') {
  const fetcherRef = useRef(fetcher)
  useLayoutEffect(() => {
    fetcherRef.current = fetcher
  })

  const [reloadCount, setReloadCount] = useState(0)
  const [result, setResult] = useState<Result<T> | null>(null)
  const requestKey = `${key}:${reloadCount}`

  useEffect(() => {
    let cancelled = false
    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setResult({ requestKey, data, error: null })
      })
      .catch((err) => {
        if (!cancelled) setResult({ requestKey, data: null, error: parseApiError(err).message })
      })
    return () => {
      cancelled = true
    }
  }, [requestKey])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])

  const setData = useCallback((update: Updater<T>) => {
    setResult((prev) => {
      if (!prev) return prev
      const data = typeof update === 'function' ? (update as (p: T | null) => T | null)(prev.data) : update
      return { ...prev, data }
    })
  }, [])

  return {
    data: result?.data ?? null,
    error: result?.requestKey === requestKey ? result.error : null,
    isLoading: result?.requestKey !== requestKey,
    setData,
    reload,
  }
}
