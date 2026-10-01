import logo from '../assets/logo.png'

interface LogoProps {
  className?: string
}

export function Logo({ className = 'h-12 w-auto' }: LogoProps) {
  // The logo has dark lettering, so in dark mode it sits on a light tile to stay readable.
  return (
    <img
      src={logo}
      alt="SkillHire AI"
      className={`dark:rounded-xl dark:bg-white dark:p-1 dark:shadow-sm ${className}`}
    />
  )
}
