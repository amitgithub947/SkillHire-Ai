import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { canVisit, dashboardPathFor } from './rolePaths'

/**
 * Wraps the login and register pages. As soon as a user is logged in they are
 * sent to the page they originally asked for (if their role allows it) or to
 * their own dashboard.
 */
export function PublicOnlyRoute() {
  const { user } = useAuth()
  const location = useLocation()

  if (user) {
    const from = (location.state as { from?: string } | null)?.from
    const target = from && canVisit(user.role, from) ? from : dashboardPathFor(user.role)
    return <Navigate to={target} replace />
  }

  return <Outlet />
}
