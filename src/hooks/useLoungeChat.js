import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getDevice } from '../lib/visitor'
import { maskBadWords } from '../lib/chat'
import { getGeo } from '../lib/geo'

const PAGE = 50

// Small delay so a quick mount/unmount (page switch, StrictMode) never opens a socket
const CONNECT_DELAY_MS = 300

// The owner account you created in Supabase (Authentication -> Users)
const OWNER_EMAIL = 'amieljakebaril@gmail.com'

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
  const [isOwner, setIsOwner] = useState(false)
  const [ownerReady, setOwnerReady] = useState(false) // true once the first owner check has finished
  const seen = useRef(new Set())

  // Asks the database whether this browser is logged in as the owner (the database is the source of truth)
  const refreshOwner = useCallback(async () => {
    let ok = false
    try {
      if (supabase) {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          const { data: res, error: err } = await supabase.rpc('is_lounge_owner')
          ok = !err && res === true
        }
      }
    } catch {
      ok = false
    }
    setIsOwner(ok)
    setOwnerReady(true)
    return ok
  }, [])

  useEffect(() => {
    refreshOwner()
  }, [refreshOwner])

  // Owner login (the password is never stored in the code). Returns true when it worked.
  const ownerLogin = useCallback(
    async (password) => {
      if (!supabase || !password) return false
      const { error: err } = await supabase.auth.signInWithPassword({
        email: OWNER_EMAIL,
        password,
      })
      if (err) return false
      return refreshOwner()
    },
    [refreshOwner],
  )

  const ownerLogout = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setIsOwner(false)
  }, [])

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
    let channel = null

    async function load() {
      try {
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
      } catch {
        if (!cancelled) setError("couldn't load messages")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()

    // Open the realtime channel after a short delay (see CONNECT_DELAY_MS)
    const timer = setTimeout(() => {
      if (cancelled) return
      channel = supabase
        .channel('lounge-messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => addMessage(payload.new),
        )
        .subscribe()
    }, CONNECT_DELAY_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
      if (channel) supabase.removeChannel(channel)
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

  // Sends a message. Returns true when it worked, false when it failed,
  // or 'name' when the database refused the name (reserved or invalid).
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
        if (/name not available|invalid name/i.test(msg)) {
          setError('')
          return 'name'
        }
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

  return {
    messages,
    total,
    loading,
    hasMore,
    loadingOlder,
    sending,
    error,
    send,
    loadOlder,
    isOwner,
    ownerReady,
    ownerLogin,
    ownerLogout,
  }
}