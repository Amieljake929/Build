import { useEffect, useState } from 'react'

// How often the page asks for the currently playing song (ms)
const NOW_POLL_MS = 10000

async function getJson(url, signal) {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  // In local dev, Vite answers unknown /api paths with the HTML page, so check
  if (!(res.headers.get('content-type') || '').includes('application/json')) {
    throw new Error('Not JSON')
  }
  return res.json()
}

// top: null while loading, { unavailable: true } on failure
// now: null while loading, { track, isPlaying, stale } or { unavailable: true }
export default function useSpotify() {
  const [top, setTop] = useState(null)
  const [now, setNow] = useState(null)

  useEffect(() => {
    const ctrl = new AbortController()
    getJson('/api/spotify-top', ctrl.signal)
      .then(setTop)
      .catch(() => {
        if (!ctrl.signal.aborted) setTop({ unavailable: true })
      })
    return () => ctrl.abort()
  }, [])

  useEffect(() => {
    let timer
    let ctrl

    const load = async () => {
      ctrl = new AbortController()
      try {
        setNow(await getJson('/api/spotify-now', ctrl.signal))
      } catch {
        // Keep the last known song if one request fails
        if (!ctrl.signal.aborted) setNow((prev) => prev ?? { unavailable: true })
      }
    }

    const tick = () => {
      if (!document.hidden) load()
      timer = setTimeout(tick, NOW_POLL_MS)
    }
    const onVisible = () => {
      if (!document.hidden) load()
    }

    tick()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      ctrl?.abort()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return { top, now }
}