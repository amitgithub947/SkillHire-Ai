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

export interface DashboardInfo {
  message: string
  userId: number
  email: string
  role: string
}
