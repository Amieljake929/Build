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

  const toggleTheme = useCallback((event) => {
    const next = getSnapshot() === 'dark' ? 'light' : 'dark'

    // Origin of the reveal = center of the clicked button
    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

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

    const transition = document.startViewTransition(apply)

    transition.ready.then(() => {
      root().animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 800,
          easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
  }, [])

  return { theme, toggleTheme }
}