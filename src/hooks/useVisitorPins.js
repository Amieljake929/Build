import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getGeo } from '../lib/geo'

const LIMIT = 300

// Places visitors have chatted from (one pin per place), plus the current visitor.
export default function useVisitorPins() {
  const [pins, setPins] = useState([])
  const [me, setMe] = useState(null)

  useEffect(() => {
    let alive = true

    getGeo().then((g) => {
      if (alive && g.lat != null && g.lng != null) setMe(g)
    })

    if (!supabase) {
      return () => {
        alive = false
      }
    }

    const byKey = new Map()
    const commit = () => alive && setPins([...byKey.values()])
    const add = (row) => {
      if (typeof row.lat !== 'number' || typeof row.lng !== 'number') return
      const key = `${row.lat.toFixed(1)},${row.lng.toFixed(1)}`
      const pin = byKey.get(key)
      if (pin) pin.count += 1
      else {
        byKey.set(key, {
          key,
          lat: row.lat,
          lng: row.lng,
          city: row.city || '',
          country: row.country || '',
          count: 1,
        })
      }
    }

    supabase
      .from('messages')
      .select('lat,lng,city,country')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .order('id', { ascending: false })
      .limit(LIMIT)
      .then(({ data }) => {
        if (!alive || !data) return
        data.forEach(add)
        commit()
      })

    // New messages add pins live
    const channel = supabase
      .channel('lounge-pins')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        add(payload.new)
        commit()
      })
      .subscribe()

    return () => {
      alive = false
      supabase.removeChannel(channel)
    }
  }, [])

  return { pins, me }
}