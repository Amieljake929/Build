import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Laptop, Loader2, MessageSquare, Smartphone, Square, Volume2 } from 'lucide-react'
import useLoungeChat from '../hooks/useLoungeChat'
import useXana from '../hooks/useXana'
import { supabase } from '../lib/supabase'
import { avatarUri } from '../lib/avatar'
import { timeAgo } from '../lib/chat'
import { XANA_NAME } from '../lib/xana'
import {
  OWNER_COMMAND,
  OWNER_NAME,
  cleanName,
  getStoredName,
  isNameFormatOk,
  isReservedName,
  setStoredName,
} from '../lib/visitor'

const ease = [0.22, 1, 0.36, 1]

// Amiel's orange (name and bubble outline)
const OWNER_COLOR = '#f5945c'
// Avatar border: a slightly darker orange (make it darker by lowering the values, lighter by raising them)
const OWNER_AVATAR_BORDER = '#dd7a40'
// Owner bubble: a soft orange tint with an orange outline (change the numbers to taste)
const OWNER_BUBBLE_FILL = 'rgba(245, 148, 92, 0.2)'
const OWNER_BUBBLE_BORDER = 'rgba(245, 148, 92, 0.75)'

// Only auto-focus on devices with a real keyboard (a phone would pop its keyboard open)
const canAutoFocus = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

// Terminal / CLI icon (rounded screen with a ">_" prompt). Only the owner gets this one.
function TerminalIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="4" />
      <path d="M7 9.5 10.5 12 7 14.5" />
      <path d="M13.5 15h3.5" />
    </svg>
  )
}

// voice: 'idle' | 'loading' | 'playing' (for this message only)
function Message({ m, now, voice, onVoice }) {
  const place = [m.city, m.country].filter(Boolean).join(', ')
  // Only the owner can use these names (the database enforces it), so these messages are Amiel's
  const isOwnerMsg = isReservedName(m.name)
  // Everyone else gets the icon for the device they actually used; the owner always gets the terminal
  const DeviceIcon = isOwnerMsg ? TerminalIcon : m.device === 'mobile' ? Smartphone : Laptop

  const active = voice !== 'idle'
  const VoiceIcon = voice === 'loading' ? Loader2 : voice === 'playing' ? Square : Volume2
  const voiceLabel = active ? `Stop ${XANA_NAME}` : `Listen with ${XANA_NAME}`

  return (
    <motion.li
      className="group flex items-end gap-2.5 sm:gap-3"
      initial={m.fresh ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease } }}
    >
      <img
        src={avatarUri(m.name)}
        alt=""
        // Owner only: a simple circular border drawn inside the avatar, so the list can't clip it
        className={`size-7 shrink-0 rounded-full bg-white sm:size-8 ${isOwnerMsg ? 'border-2' : ''}`}
        style={isOwnerMsg ? { borderColor: OWNER_AVATAR_BORDER } : undefined}
      />
      <div className="min-w-0">
        <p className="mb-1 flex flex-wrap items-center gap-x-1.5 text-[0.7rem] text-white/40 sm:text-xs">
          <span
            className={isOwnerMsg ? 'font-medium' : 'text-white/80'}
            style={isOwnerMsg ? { color: OWNER_COLOR } : undefined}
          >
            {m.name}
          </span>
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
        <div className="flex items-center gap-1.5">
          <p
            className={`inline-block min-w-0 max-w-full rounded-2xl border px-3.5 py-2 text-sm leading-snug text-white [overflow-wrap:anywhere] sm:px-4 sm:py-2.5 sm:text-[0.95rem] ${
              isOwnerMsg ? '' : 'border-transparent bg-white/10'
            }`}
            style={
              isOwnerMsg
                ? { backgroundColor: OWNER_BUBBLE_FILL, borderColor: OWNER_BUBBLE_BORDER }
                : undefined
            }
          >
            {m.body}
          </p>
          {/* Xaña's read-aloud button: shows on hover (always on touch screens), and while she is reading */}
          <button
            type="button"
            onClick={onVoice}
            title={voiceLabel}
            aria-label={voiceLabel}
            className={`flex size-6 shrink-0 items-center justify-center rounded-full text-white/50 transition-all duration-200 hover:bg-white/10 hover:text-white focus-visible:opacity-100 focus-visible:outline-none [@media(pointer:coarse)]:opacity-100 ${
              active ? 'opacity-100 text-white' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <VoiceIcon
              className={`size-3.5 ${voice === 'loading' ? 'animate-spin' : ''} ${
                voice === 'playing' ? 'fill-current' : ''
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </motion.li>
  )
}

export default function LoungeChat() {
  const chat = useLoungeChat()
  const xana = useXana()
  const [name, setName] = useState(() => getStoredName())
  const [editingName, setEditingName] = useState(() => !getStoredName())
  const [nameDraft, setNameDraft] = useState(() => getStoredName())
  const [nameError, setNameError] = useState('')
  const [ownerMode, setOwnerMode] = useState(false) // owner password box (type /owner in the name box)
  const [ownerPass, setOwnerPass] = useState('')
  const [ownerBusy, setOwnerBusy] = useState(false)
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

  // A saved name that is reserved (and this visitor is not the owner) has to be replaced
  useEffect(() => {
    if (!chat.ownerReady || chat.isOwner) return
    if (name && isReservedName(name)) {
      setStoredName('')
      setName('')
      setNameDraft('')
      setEditingName(true)
      setNameError('this name is not available, pick another one')
    }
  }, [chat.ownerReady, chat.isOwner, name])

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

    // Hidden shortcut for the owner login
    if (clean.toLowerCase() === OWNER_COMMAND) {
      setOwnerMode(true)
      setNameDraft('')
      setNameError('')
      return
    }

    if (!isNameFormatOk(clean)) {
      setNameError('names can only use letters and spaces')
      return
    }
    if (isReservedName(clean) && !chat.isOwner) {
      setNameError('this name is not available')
      return
    }

    setNameError('')
    setStoredName(clean)
    setName(clean)
    setEditingName(false)
  }

  async function submitOwner(e) {
    e.preventDefault()
    if (!ownerPass || ownerBusy) return
    setOwnerBusy(true)
    const ok = await chat.ownerLogin(ownerPass)
    setOwnerBusy(false)
    setOwnerPass('')
    if (ok) {
      setStoredName(OWNER_NAME)
      setName(OWNER_NAME)
      setNameDraft(OWNER_NAME)
      setNameError('')
      setOwnerMode(false)
      setEditingName(false)
    } else {
      setNameError('wrong password')
    }
  }

  async function submitMessage(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || chat.sending) return
    stickRef.current = true
    const result = await chat.send(name, text)
    if (result === true) {
      setDraft('')
    } else if (result === 'name') {
      // The database refused this name, so ask for a new one
      setStoredName('')
      setName('')
      setNameDraft('')
      setEditingName(true)
      setNameError('this name is not available, pick another one')
    }
  }

  // text-base (16px) on phones: smaller input text makes iPhones zoom in when you tap it
  const inputClass =
    'min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/30 sm:text-lg'
  const hintClass =
    'shrink-0 text-xs text-white/45 transition-colors duration-300 hover:text-white disabled:opacity-40'

  const nameIsOwner = isReservedName(name)

  // The small line under the input: errors in red, Xaña's status in grey
  const formError = editingName || ownerMode ? nameError : chat.error
  const xanaLine =
    formError || editingName || ownerMode
      ? ''
      : xana.note ||
        (xana.status === 'loading'
          ? `${XANA_NAME} is getting ready…`
          : xana.status === 'playing'
            ? `${XANA_NAME} is reading…`
            : '')

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
                <Message
                  key={m.id}
                  m={m}
                  now={now}
                  voice={xana.activeId === m.id ? xana.status : 'idle'}
                  onVoice={() => xana.speak(m.id, m.body)}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Owner login, name prompt (first visit) or message box */}
      <div className="mt-5 sm:mt-6">
        {ownerMode ? (
          <form onSubmit={submitOwner}>
            <p className="text-sm text-white/60">owner password</p>
            <div className="mt-3 flex items-center gap-4">
              <input
                type="password"
                value={ownerPass}
                onChange={(e) => {
                  setOwnerPass(e.target.value)
                  setNameError('')
                }}
                placeholder="password"
                autoComplete="current-password"
                autoFocus
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => {
                  setOwnerMode(false)
                  setOwnerPass('')
                  setNameError('')
                }}
                className={hintClass}
              >
                back
              </button>
              <button type="submit" disabled={!ownerPass || ownerBusy} className={hintClass}>
                sign in ↵
              </button>
            </div>
          </form>
        ) : editingName ? (
          <form onSubmit={submitName}>
            <p className="text-sm text-white/60">what's your name?</p>
            <div className="mt-3 flex items-center gap-4">
              <input
                value={nameDraft}
                onChange={(e) => {
                  setNameDraft(e.target.value)
                  setNameError('')
                }}
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
              chatting as{' '}
              <strong
                className={`font-semibold ${nameIsOwner ? '' : 'text-white'}`}
                style={nameIsOwner ? { color: OWNER_COLOR } : undefined}
              >
                {name}
              </strong>
              <button
                type="button"
                onClick={() => {
                  setNameDraft(name)
                  setNameError('')
                  setEditingName(true)
                }}
                className="ml-3 text-xs text-white/35 underline decoration-white/20 underline-offset-4 transition-colors duration-300 hover:text-white"
              >
                change name
              </button>
              {chat.isOwner && (
                <button
                  type="button"
                  onClick={chat.ownerLogout}
                  className="ml-3 text-xs text-white/35 underline decoration-white/20 underline-offset-4 transition-colors duration-300 hover:text-white"
                >
                  sign out
                </button>
              )}
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
        {/* Small inline message under the input */}
        <p
          className={`mt-2 h-4 text-xs ${formError ? 'text-red-400/80' : 'text-white/40'}`}
          role="status"
        >
          {formError || xanaLine}
        </p>
      </div>
    </div>
  )
}