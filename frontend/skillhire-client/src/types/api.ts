/** Shape of ASP.NET Core ProblemDetails / ValidationProblemDetails responses. */
export interface ProblemDetails {
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string[]>
}

export interface ApiError {
  message: string
  /** Field name (camelCase) -> first error message for that field. */
  fieldErrors: Record<string, string>
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}