import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { themeStorage } from '../services/themeStorage'
import { ThemeContext, type Theme, type ThemeContextValue } from './ThemeContext'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => themeStorage.get())

  // Tailwind's dark: styles key off this class on <html>.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    themeStorage.set(next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme])

  const value = useMemo<ThemeContextValue>(() => ({ theme, toggleTheme, setTheme }), [theme, toggleTheme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
