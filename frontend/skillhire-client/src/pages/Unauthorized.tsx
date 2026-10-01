import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useAuth } from '../context/useAuth'
import { dashboardPathFor } from '../routes/rolePaths'

export default function Unauthorized() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo className="h-20 w-auto" />
      <h1 className="mt-8 text-3xl font-bold text-brand-navy">Access denied</h1>
      <p className="mt-2 max-w-md text-slate-500">
        Your account does not have permission to open this page.
      </p>
      <Link
        to={user ? dashboardPathFor(user.role) : '/login'}
        className="mt-6 rounded-lg bg-brand-blue px-4 py-2 font-semibold text-white hover:bg-blue-700"
      >
        {user ? 'Go to my dashboard' : 'Go to login'}
      </Link>
    </div>
  )
}
