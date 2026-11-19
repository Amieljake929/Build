import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getClientId, getStoredName } from '../lib/visitor'

const seedFor = () => getStoredName() || `visitor-${getClientId().slice(0, 6)}`

// Small delay so a quick mount/unmount (page switch, StrictMode) never opens a socket
const CONNECT_DELAY_MS = 300

// Counts everyone currently on the site (one per browser) using Supabase Presence.
export default function usePresence() {
  const [state, setState] = useState({ count: 0, seeds: [] })

  useEffect(() => {
    if (!supabase) return

    let channel = null
    let cancelled = false

    const timer = setTimeout(() => {
      if (cancelled) return

      channel = supabase.channel('site-presence', {
        config: { presence: { key: getClientId() } },
      })

      channel.on('presence', { event: 'sync' }, () => {
        if (cancelled) return
        const entries = Object.values(channel.presenceState())
        setState({
          count: entries.length,
          seeds: entries
            .slice(0, 3)
            .map((metas) => metas[metas.length - 1]?.seed)
            .filter(Boolean),
        })
      })

      channel.subscribe((status) => {
        if (!cancelled && status === 'SUBSCRIBED') channel.track({ seed: seedFor() })
      })
    }, CONNECT_DELAY_MS)

    // When the visitor picks a name in the Lounge, update their avatar here too
    const onName = () => {
      if (channel && channel.state === 'joined') channel.track({ seed: seedFor() })
    }
    window.addEventListener('lounge:name', onName)

    return () => {
      cancelled = true
      clearTimeout(timer)
      window.removeEventListener('lounge:name', onName)
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  return state
}