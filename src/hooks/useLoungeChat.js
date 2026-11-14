import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getDevice } from '../lib/visitor'
import { maskBadWords } from '../lib/chat'
import { getGeo } from '../lib/geo'

const PAGE = 50

// Captcha is only used when a Turnstile site key is set in the env variables
const CAPTCHA_ON = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY)

// Visitors only get an anonymous account when they send their first message
async function ensureSession(captchaToken) {
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session
  if (CAPTCHA_ON && !captchaToken) throw new Error('captcha')
  const { data: res, error } = await supabase.auth.signInAnonymously({
    options: captchaToken ? { captchaToken } : undefined,
  })
  if (error) throw error
  return res.session
}

export default function useLoungeChat() {
  const [messages, setMessages] = useState([])
  const [total, setTotal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const seen = useRef(new Set())

  // Adds one new message (from realtime or from our own send), ignoring duplicates
  const addMessage = useCallback((msg) => {
    if (seen.current.has(msg.id)) return
    seen.current.add(msg.id)
    setMessages((prev) => [...prev, { ...msg, fresh: true }])
    setTotal((t) => (t == null ? t : t + 1))
  }, [])

  // First load + live updates
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let cancelled = false

    async function load() {
      const [latest, count] = await Promise.all([
        supabase.from('messages').select('*').order('id', { ascending: false }).limit(PAGE),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
      ])
      if (cancelled) return

      if (latest.error) {
        setError("couldn't load messages")
      } else {
        const rows = [...(latest.data ?? [])].reverse()
        rows.forEach((m) => seen.current.add(m.id))
        setMessages((prev) => {
          const extra = prev.filter((m) => !rows.some((r) => r.id === m.id))
          return [...rows, ...extra]
        })
        setHasMore(rows.length === PAGE)
      }
      setTotal(count.count ?? latest.data?.length ?? 0)
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('lounge-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) =>
        addMessage(payload.new),
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [addMessage])

  // Older messages, loaded when the visitor scrolls to the top
  const loadOlder = useCallback(async () => {
    if (!supabase || loadingOlder || !hasMore) return
    const oldest = messages[0]?.id
    if (oldest == null) return

    setLoadingOlder(true)
    const { data, error: err } = await supabase
      .from('messages')
      .select('*')
      .lt('id', oldest)
      .order('id', { ascending: false })
      .limit(PAGE)

    if (!err && data) {
      const rows = [...data].reverse()
      rows.forEach((m) => seen.current.add(m.id))
      setMessages((prev) => [...rows, ...prev])
      setHasMore(rows.length === PAGE)
    }
    setLoadingOlder(false)
  }, [messages, hasMore, loadingOlder])

  // Sends a message. Returns true when it worked.
  const send = useCallback(
    async (name, raw, captchaToken) => {
      const body = maskBadWords(raw.trim()).slice(0, 280)
      if (!body) return false
      if (!supabase) {
        setError('the lounge is offline right now')
        return false
      }

      setSending(true)
      setError('')
      try {
        await ensureSession(captchaToken)
        const geo = await getGeo()
        const { data, error: err } = await supabase
          .from('messages')
          .insert({
            name,
            body,
            city: geo.city || null,
            country: geo.country || null,
            lat: geo.lat,
            lng: geo.lng,
            device: getDevice(),
          })
          .select()
          .single()
        if (err) throw err
        addMessage(data)
        return true
      } catch (err) {
        const msg = err?.message ?? ''
        setError(
          /slow down/i.test(msg)
            ? 'slow down a little'
            : /captcha/i.test(msg)
              ? 'verifying you are human, try again in a moment'
              : "couldn't send, try again",
        )
        return false
      } finally {
        setSending(false)
      }
    },
    [addMessage],
  )

  return { messages, total, loading, hasMore, loadingOlder, sending, error, send, loadOlder }
}