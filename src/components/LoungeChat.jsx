import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Laptop, MessageSquare, Smartphone } from 'lucide-react'
import useLoungeChat from '../hooks/useLoungeChat'
import { supabase } from '../lib/supabase'
import { avatarUri } from '../lib/avatar'
import { timeAgo } from '../lib/chat'
import { cleanName, getStoredName, setStoredName } from '../lib/visitor'

const ease = [0.22, 1, 0.36, 1]

// Only auto-focus on devices with a real keyboard (a phone would pop its keyboard open)
const canAutoFocus = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

function Message({ m, now }) {
  const place = [m.city, m.country].filter(Boolean).join(', ')
  const DeviceIcon = m.device === 'mobile' ? Smartphone : Laptop

  return (
    <motion.li
      className="flex items-end gap-2.5 sm:gap-3"
      initial={m.fresh ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease } }}
    >
      <img
        src={avatarUri(m.name)}
        alt=""
        className="size-7 shrink-0 rounded-full bg-white sm:size-8"
      />
      <div className="min-w-0">
        <p className="mb-1 flex flex-wrap items-center gap-x-1.5 text-[0.7rem] text-white/40 sm:text-xs">
          <span className="text-white/80">{m.name}</span>
          {place && (
            <>
              <span className="text-white/20">·</span>
              <span>{place}</span>
            </>
          )}
          <DeviceIcon className="size-3" aria-hidden="true" />
          <span className="text-white/20">·</span>
          <span>{timeAgo(m.created_at, now)}</span>
        </p>
        <p className="inline-block max-w-full rounded-2xl bg-white/10 px-3.5 py-2 text-sm leading-snug text-white [overflow-wrap:anywhere] sm:px-4 sm:py-2.5 sm:text-[0.95rem]">
          {m.body}
        </p>
      </div>
    </motion.li>
  )
}

export default function LoungeChat() {
  const chat = useLoungeChat()
  const [name, setName] = useState(() => getStoredName())
  const [editingName, setEditingName] = useState(() => !getStoredName())
  const [nameDraft, setNameDraft] = useState(() => getStoredName())
  const [draft, setDraft] = useState('')
  const [now, setNow] = useState(() => Date.now())

  const listRef = useRef(null)
  const stickRef = useRef(true) // keep the list pinned to the newest message
  const prevHeightRef = useRef(0) // keeps the scroll position when older messages load

  // Refresh the "5m ago" labels
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  // Scroll handling: stay at the bottom for new messages, keep position when older ones load
  useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return
    if (prevHeightRef.current) {
      el.scrollTop += el.scrollHeight - prevHeightRef.current
      prevHeightRef.current = 0
    } else if (stickRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [chat.messages])

  useEffect(() => {
    if (!chat.loadingOlder) prevHeightRef.current = 0
  }, [chat.loadingOlder])

  function handleScroll() {
    const el = listRef.current
    if (!el) return
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (el.scrollTop < 60 && chat.hasMore && !chat.loadingOlder) {
      prevHeightRef.current = el.scrollHeight
      chat.loadOlder()
    }
  }

  function submitName(e) {
    e.preventDefault()
    const clean = cleanName(nameDraft)
    if (!clean) return
    setStoredName(clean)
    setName(clean)
    setEditingName(false)
  }

  async function submitMessage(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || chat.sending) return
    stickRef.current = true
    const ok = await chat.send(name, text)
    if (ok) setDraft('')
  }

  // text-base (16px) on phones: smaller input text makes iPhones zoom in when you tap it
  const inputClass =
    'min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/30 sm:text-lg'
  const hintClass =
    'shrink-0 text-xs text-white/45 transition-colors duration-300 hover:text-white disabled:opacity-40'

  return (
      <div className="flex h-[min(calc(100dvh-10rem),31rem)] w-full flex-col sm:h-[min(calc(100dvh-7rem),38rem)]">
      {/* Header: total message count */}
      <p className="flex items-center gap-2 text-xs text-white/45">
        <MessageSquare className="size-3.5" aria-hidden="true" />
        {chat.total ?? '–'} messages
      </p>

      {/* Messages */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="mt-4 flex-1 overflow-y-auto pr-1 [mask-image:linear-gradient(to_bottom,transparent,black_2rem)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {!supabase ? (
          <p className="pt-10 text-sm text-white/45">the lounge is offline right now.</p>
        ) : chat.loading ? (
          <p className="animate-pulse pt-10 text-sm text-white/30">loading…</p>
        ) : (
          <>
            {chat.hasMore && (
              <p
                className={`pb-4 text-center text-white/30 ${chat.loadingOlder ? 'animate-pulse' : ''}`}
                aria-hidden="true"
              >
                ···
              </p>
            )}
            {chat.messages.length === 0 && (
              <p className="pt-10 text-sm text-white/45">no messages yet. say hi.</p>
            )}
            <ul className="space-y-3.5 pt-2 pb-2 sm:space-y-4">
              {chat.messages.map((m) => (
                <Message key={m.id} m={m} now={now} />
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Name prompt (first visit) or message box */}
      <div className="mt-5 sm:mt-6">
        {editingName ? (
          <form onSubmit={submitName}>
            <p className="text-sm text-white/60">what's your name?</p>
            <div className="mt-3 flex items-center gap-4">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={20}
                placeholder="your name"
                autoComplete="off"
                autoFocus={canAutoFocus()}
                className={inputClass}
              />
              <button type="submit" disabled={!cleanName(nameDraft)} className={hintClass}>
                next ↵
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={submitMessage}>
            <p className="text-sm text-white/60">
              chatting as <strong className="font-semibold text-white">{name}</strong>
              <button
                type="button"
                onClick={() => {
                  setNameDraft(name)
                  setEditingName(true)
                }}
                className="ml-3 text-xs text-white/35 underline decoration-white/20 underline-offset-4 transition-colors duration-300 hover:text-white"
              >
                change name
              </button>
            </p>
            <div className="mt-3 flex items-center gap-4">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={280}
                placeholder="say something…"
                autoComplete="off"
                autoFocus={canAutoFocus()}
                className={inputClass}
              />
              <button type="submit" disabled={!draft.trim() || chat.sending} className={hintClass}>
                send ↵
              </button>
            </div>
          </form>
        )}
        <p className="mt-2 h-4 text-xs text-red-400/80" role="status">
          {chat.error}
        </p>
      </div>
    </div>
  )
}