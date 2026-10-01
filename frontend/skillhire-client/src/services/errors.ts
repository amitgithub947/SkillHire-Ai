import axios from 'axios'
import type { ApiError, ProblemDetails } from '../types/api'

/** Turns any thrown error into a friendly message plus per-field errors. */
export function parseApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return { message: 'Something went wrong. Please try again.', fieldErrors: {} }
  }

  if (!error.response) {
    return {
      message: 'Cannot reach the server. Check that the API is running.',
      fieldErrors: {},
    }
  }

  const data = error.response.data as ProblemDetails | undefined
  const fieldErrors: Record<string, string> = {}

  if (data?.errors) {
    for (const [key, messages] of Object.entries(data.errors)) {
      if (messages.length > 0) {
        fieldErrors[toCamelCase(key)] = messages[0]
      }
    }
  }

  const message =
    data?.detail ??
    (Object.keys(fieldErrors).length > 0 ? 'Please fix the highlighted fields.' : undefined) ??
    data?.title ??
    'Something went wrong. Please try again.'

  return { message, fieldErrors }
}

// ASP.NET returns "Email" / "CompanyName"; our form fields use camelCase.
function toCamelCase(key: string): string {
  const field = key.replace(/^\$\./, '')
  return field.charAt(0).toLowerCase() + field.slice(1)
}
