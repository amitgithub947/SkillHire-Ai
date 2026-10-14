import { ButtonLink } from '../components/Button'
import { Logo } from '../components/Logo'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo className="h-12 w-auto" />
      <p className="mt-10 text-sm font-medium text-brand-blue dark:text-blue-400">404</p>
      <h1 className="mt-1 text-2xl font-semibold text-brand-navy dark:text-slate-100">Page not found</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">The page you are looking for does not exist.</p>
      <ButtonLink to="/" className="mt-6">
        Back to home
      </ButtonLink>
    </main>
  )
}
