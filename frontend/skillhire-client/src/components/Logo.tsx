import logo from '../assets/logo.png'

interface LogoProps {
  className?: string
  /** Always sit on a white tile, for dark surfaces in light mode too. */
  tile?: boolean
}

export function Logo({ className = 'h-12 w-auto', tile = false }: LogoProps) {
  // The logo has dark lettering, so on dark surfaces it sits on a light tile to stay readable.
  const tileClasses = tile ? 'rounded-md bg-white p-1' : 'dark:rounded-md dark:bg-white dark:p-1'
  return <img src={logo} alt="SkillHire AI" className={`${tileClasses} ${className}`} />
}
