import type { Theme } from '../context/ThemeContext'

// Also read by the small script in index.html, which applies the theme before React loads.
const STORAGE_KEY = 'skillhire.theme'

export const themeStorage = {
  /** The saved choice, or the operating system's preference if the user never picked one. */
  get(): Theme {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'light' || saved === 'dark') return saved
    } catch {
      // Storage can be blocked (private mode); fall back to the OS setting.
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  },

  set(theme: Theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Not saved, but the theme still changes for this visit.
    }
  },
}
