import { ButtonLink } from '../components/Button'
import { Logo } from '../components/Logo'
import { useAuth } from '../context/useAuth'
import { dashboardPathFor } from '../routes/rolePaths'

export default function Unauthorized() {
  const { user } = useAuth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo className="h-12 w-auto" />
      <p className="mt-10 text-sm font-medium text-red-700 dark:text-red-400">403</p>
      <h1 className="mt-1 text-2xl font-semibold text-brand-navy dark:text-slate-100">Access denied</h1>
      <p className="mt-2 max-w-md text-slate-500 dark:text-slate-400">Your account does not have permission to open this page.</p>
      <ButtonLink to={user ? dashboardPathFor(user.role) : '/login'} className="mt-6">
        {user ? 'Go to my dashboard' : 'Go to login'}
      </ButtonLink>
    </main>
  )
}
