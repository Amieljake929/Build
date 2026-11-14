import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getClientId, getStoredName } from '../lib/visitor'

const seedFor = () => getStoredName() || `visitor-${getClientId().slice(0, 6)}`

// Counts everyone currently on the site (one per browser) using Supabase Presence.
export default function usePresence() {
  const [state, setState] = useState({ count: 0, seeds: [] })

  useEffect(() => {
    if (!supabase) return

    const channel = supabase.channel('site-presence', {
      config: { presence: { key: getClientId() } },
    })

    channel.on('presence', { event: 'sync' }, () => {
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
      if (status === 'SUBSCRIBED') channel.track({ seed: seedFor() })
    })

    // When the visitor picks a name in the Lounge, update their avatar here too
    const onName = () => {
      if (channel.state === 'joined') channel.track({ seed: seedFor() })
    }
    window.addEventListener('lounge:name', onName)

    return () => {
      window.removeEventListener('lounge:name', onName)
      supabase.removeChannel(channel)
    }
  }, [])

  return state
}