import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'theme'
const root = () => document.documentElement

// The theme lives on <html data-theme="...">. Every component that calls
// useTheme() reads it from there, so several toggles always stay in sync.
const subscribe = (callback) => {
  const observer = new MutationObserver(callback)
  observer.observe(root(), { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

const getSnapshot = () => (root().dataset.theme === 'dark' ? 'dark' : 'light')
const getServerSnapshot = () => 'light'

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggleTheme = useCallback(() => {
    const next = getSnapshot() === 'dark' ? 'light' : 'dark'

    const apply = () => {
      root().dataset.theme = next
    }

    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* storage unavailable, ignore */
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduceMotion) {
      apply()
      return
    }

    // The glitch animation itself lives in index.css (vt-glitch-old / vt-glitch-new)
    root().dataset.vt = 'glitch'
    const transition = document.startViewTransition(apply)
    transition.finished.finally(() => {
      delete root().dataset.vt
    })
  }, [])

  return { theme, toggleTheme }
}