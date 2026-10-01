import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo className="h-20 w-auto" />
      <h1 className="mt-8 text-3xl font-bold text-brand-navy">Page not found</h1>
      <p className="mt-2 text-slate-500">The page you are looking for does not exist.</p>
      <Link to="/" className="mt-6 rounded-lg bg-brand-blue px-4 py-2 font-semibold text-white hover:bg-blue-700">
        Back to home
      </Link>
    </div>
  )
}
