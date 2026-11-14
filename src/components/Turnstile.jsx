import { useEffect, useRef } from 'react'

const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let scriptPromise

function loadScript() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = SRC
      s.async = true
      s.onload = () => resolve(window.turnstile)
      s.onerror = () => {
        scriptPromise = undefined
        reject(new Error('turnstile failed to load'))
      }
      document.head.appendChild(s)
    })
  }
  return scriptPromise
}

// Invisible human check: only shows something if Cloudflare wants an interaction.
export default function Turnstile({ siteKey, onToken }) {
  const ref = useRef(null)

  useEffect(() => {
    let widgetId
    let cancelled = false

    loadScript()
      .then((ts) => {
        if (cancelled || !ref.current) return
        widgetId = ts.render(ref.current, {
          sitekey: siteKey,
          theme: 'dark',
          appearance: 'interaction-only',
          callback: (token) => onToken(token),
          'expired-callback': () => onToken(''),
          'error-callback': () => onToken(''),
        })
      })
      .catch(() => onToken(''))

    return () => {
      cancelled = true
      if (widgetId != null && window.turnstile) window.turnstile.remove(widgetId)
    }
  }, [siteKey, onToken])

  return <div ref={ref} className="mt-3" />
}