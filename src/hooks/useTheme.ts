// src/hooks/useTheme.ts
import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
const STORAGE_KEY = 'smartrh-theme'

const initialTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // private mode / blocked storage — fall through to the default
  }
  // The smartRH design is authored light-first; dark is opt-in via the topbar toggle.
  return 'light'
}

/** Light/dark switch for the topbar. Writes `data-theme` on <html> and remembers the choice. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* storage unavailable */ }
  }, [theme])

  const toggle = useCallback(() => setTheme(current => (current === 'dark' ? 'light' : 'dark')), [])
  return { theme, toggle }
}
