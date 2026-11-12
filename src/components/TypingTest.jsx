import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import '@fontsource/geist-pixel'
import { AMIEL_WPM, TYPING_TEXTS } from '../data/typingTexts'

const ease = [0.22, 1, 0.36, 1]
const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

// Pixel / typewriter font used for the result numbers (falls back to Courier)
const PIXEL_FONT = "'Geist Pixel', 'Courier New', Courier, monospace"

// ---- Strictness settings (tweak these to taste) ----
const ERROR_PENALTY = 2 // every wrong keystroke (even if you fix it) removes this many characters from your score
const MIN_LIVE_SECONDS = 2 // live WPM stays at 0 until this many seconds, so early bursts don't look inflated
const MIN_RESULT_SECONDS = 1
const MIN_ACCURACY_TO_BEAT = 90 // you need at least this accuracy to "beat amiel"

// Desktop only: wide screen + a mouse/trackpad. Phones and tablets never see the test.
const DESKTOP_QUERY = '(min-width: 1024px) and (hover: hover) and (pointer: fine)'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY)
    const onChange = (e) => setIsDesktop(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isDesktop
}

// Picks a random paragraph, never the same one twice in a row
function pickText(previous) {
  if (TYPING_TEXTS.length < 2) return TYPING_TEXTS[0]
  let next = previous
  while (next === previous) {
    next = TYPING_TEXTS[Math.floor(Math.random() * TYPING_TEXTS.length)]
  }
  return next
}

function countCorrect(typed, text) {
  let n = 0
  for (let i = 0; i < typed.length; i++) if (typed[i] === text[i]) n++
  return n
}

const calcAccuracy = (total, errors) =>
  total ? Math.max(0, Math.round(100 * (1 - errors / total))) : 100

// Strict WPM: correct characters minus a penalty for every mistake ever made
const calcWpm = (correct, errors, seconds) =>
  Math.max(0, Math.round((correct - errors * ERROR_PENALTY) / 5 / (seconds / 60)))

/* ---------------------------------------------------------------- */
/* Small pieces                                                      */
/* ---------------------------------------------------------------- */

function Stat({ label, value, unit, big, pixel }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={`font-semibold text-white tabular-nums ${big ? 'text-[2rem]' : 'text-2xl'}`}
        style={pixel ? { fontFamily: PIXEL_FONT, fontWeight: 400 } : undefined}
      >
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-white/45">{unit}</span>}
      </span>
      <span className="text-[0.6rem] tracking-[0.2em] text-white/45 uppercase">{label}</span>
    </div>
  )
}

function Hints({ onRestart }) {
  const kbd = 'rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 text-[0.7rem] text-white/80'
  return (
    <div data-keep className="flex items-center gap-8 text-xs text-white/45">
      <button
        type="button"
        onClick={onRestart}
        className="flex items-center gap-2 transition-colors duration-300 hover:text-white"
      >
        <kbd className={kbd}>tab</kbd> restart
      </button>
      <span className="flex items-center gap-2">
        <kbd className={kbd}>esc</kbd> or click outside to close
      </span>
    </div>
  )
}

function Key({ label, wide, active, next }) {
  const state = active
    ? 'translate-y-px border-white/60 bg-white/20 text-white'
    : next
      ? 'border-white/40 bg-white/10 text-white'
      : 'border-white/10 bg-white/[0.04] text-white/45'
  return (
    <div
      className={`grid h-11 place-items-center rounded-lg border shadow-[0_2px_0_rgba(255,255,255,0.05)] transition-[background-color,border-color,color,translate] duration-200 ease-out ${state} ${
        wide ? 'w-[18.5rem] text-[0.65rem] tracking-[0.25em] uppercase' : 'w-11 text-sm'
      }`}
    >
      {label}
    </div>
  )
}

// On-screen keyboard
function Keyboard({ pressed, next }) {
  return (
    <div data-keep className="mt-10 flex flex-col items-center gap-1.5" aria-hidden="true">
      {ROWS.map((row) => (
        <div key={row} className="flex gap-1.5">
          {[...row].map((k) => (
            <Key key={k} label={k} active={pressed === k} next={next === k} />
          ))}
        </div>
      ))}
      <Key label="space" wide active={pressed === ' '} next={next === ' '} />
    </div>
  )
}

// One letter of the paragraph: dim = not typed yet, white = right, red = wrong.
// The caret is a single shared element (layoutId) that glides from letter to letter.
function Char({ ch, i, typed, idle }) {
  const t = typed[i]
  let tone = 'text-white/25'
  if (t !== undefined) {
    if (t === ch) tone = 'text-white'
    else tone = ch === ' ' ? 'rounded-sm bg-red-400/40' : 'text-red-400'
  }
  return (
    <span className={`relative transition-colors duration-200 ease-out ${tone}`}>
      {i === typed.length && (
        <motion.span
          layoutId="typing-caret"
          className={`absolute top-[12%] -left-px h-[76%] w-0.5 rounded-full bg-white ${
            idle ? 'caret-blink' : ''
          }`}
          transition={{ type: 'spring', stiffness: 700, damping: 45, mass: 0.4 }}
        />
      )}
      {ch}
    </span>
  )
}

function KeyboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
      <path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M7 14h10" />
    </svg>
  )
}

/* ---------------------------------------------------------------- */
/* The modal                                                         */
/* ---------------------------------------------------------------- */

const viewMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25, ease } },
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease, delay } },
})

function TypingModal({ onClose }) {
  const [text, setText] = useState(() => pickText())
  const [typed, setTyped] = useState('')
  const [phase, setPhase] = useState('ready') // ready -> running -> done
  const [startAt, setStartAt] = useState(0)
  const [now, setNow] = useState(0)
  const [keys, setKeys] = useState({ total: 0, errors: 0 })
  const [result, setResult] = useState(null)
  const [pressed, setPressed] = useState('')
  const inputRef = useRef(null)

  // Each word is one non-breaking group (so words never split across lines)
  const layout = useMemo(() => {
    let i = 0
    return text.split(' ').map((word, wi, all) => {
      const str = wi < all.length - 1 ? word + ' ' : word
      return [...str].map((ch) => ({ ch, i: i++ }))
    })
  }, [text])

  const restart = useCallback(() => {
    setText((prev) => pickText(prev))
    setTyped('')
    setPhase('ready')
    setStartAt(0)
    setNow(0)
    setKeys({ total: 0, errors: 0 })
    setResult(null)
  }, [])

  // Page scroll lock + Tab (restart), Esc (close), and the pressed-key highlight
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const down = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        restart()
        return
      }
      if (e.key === ' ') setPressed(' ')
      else if (/^[a-z]$/i.test(e.key)) setPressed(e.key.toLowerCase())
    }
    const up = () => setPressed('')
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [onClose, restart])

  // Live clock while typing
  useEffect(() => {
    if (phase !== 'running') return
    const id = setInterval(() => setNow(performance.now()), 100)
    return () => clearInterval(id)
  }, [phase])

  // Keep the (invisible) input focused so typing always works
  useEffect(() => {
    if (phase !== 'done') inputRef.current?.focus()
  }, [phase, text])

  function handleChange(e) {
    if (phase === 'done') return
    const value = e.target.value.slice(0, text.length)
    const t = performance.now()

    let started = startAt
    if (phase === 'ready' && value.length > 0) {
      started = t
      setStartAt(t)
      setNow(t)
      setPhase('running')
    }

    // Count every newly typed character (fixed mistakes still count against you)
    let total = keys.total
    let errors = keys.errors
    for (let i = typed.length; i < value.length; i++) {
      total += 1
      if (value[i] !== text[i]) errors += 1
    }
    setKeys({ total, errors })
    setTyped(value)

    // Last character typed -> show the results
    if (value.length === text.length) {
      const seconds = Math.max((t - started) / 1000, MIN_RESULT_SECONDS)
      const minutes = seconds / 60
      setResult({
        wpm: calcWpm(countCorrect(value, text), errors, seconds),
        raw: Math.round(value.length / 5 / minutes),
        acc: calcAccuracy(total, errors),
        errors,
        time: seconds,
      })
      setPhase('done')
    }
  }

  // Clicking empty space closes the modal; clicking the content just refocuses the input
  function handleBackdropClick(e) {
    if (e.target.closest('[data-keep]')) inputRef.current?.focus()
    else onClose()
  }

  // Live numbers shown above the text
  const correct = countCorrect(typed, text)
  const elapsed = phase === 'running' ? Math.max((now - startAt) / 1000, 0) : 0
  const liveWpm =
    phase === 'running' && elapsed >= MIN_LIVE_SECONDS ? calcWpm(correct, keys.errors, elapsed) : 0
  const liveAcc = calcAccuracy(keys.total, keys.errors)
  const nextKey = phase === 'done' ? '' : (text[typed.length] ?? '')
  const fastEnough = result ? result.wpm >= AMIEL_WPM : false
  const accurateEnough = result ? result.acc >= MIN_ACCURACY_TO_BEAT : false
  const beat = fastEnough && accurateEnough

  return (
    <motion.div
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-[#1a1a1a]/70 px-5 py-14 backdrop-blur-lg"
      style={{ fontFamily: "'Geist', 'Geist Variable', ui-sans-serif, system-ui, sans-serif" }}
      role="dialog"
      aria-modal="true"
      aria-label="Typing test"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease }}
      onClick={handleBackdropClick}
    >
      <motion.div
        className="w-full max-w-[62rem]"
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.99 }}
        transition={{ duration: 0.6, ease, delay: 0.05 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {phase !== 'done' ? (
            /* ---------------- Typing view ---------------- */
            <motion.div key="typing" className="flex flex-col items-center" {...viewMotion}>
              <div data-keep className="flex items-start gap-14">
                <Stat label="wpm" value={liveWpm} big />
                <Stat label="acc" value={liveAcc} unit="%" big />
                <Stat label="time" value={Math.floor(elapsed)} unit="s" big />
              </div>

              <div data-keep className="relative mt-10 w-full">
                {/* key={text}: a new paragraph fades in softly instead of snapping */}
                <motion.p
                  key={text}
                  className="text-[1.75rem] leading-[1.9] select-none"
                  aria-hidden="true"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.5, ease } }}
                >
                  {layout.map((chars, wi) => (
                    <span key={wi} className="inline-block whitespace-pre">
                      {chars.map(({ ch, i }) => (
                        <Char key={i} ch={ch} i={i} typed={typed} idle={typed.length === 0} />
                      ))}
                    </span>
                  ))}
                </motion.p>

                {/* Invisible input that catches the typing */}
                <textarea
                  ref={inputRef}
                  value={typed}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' ||
                      e.key === 'Delete' ||
                      e.key === 'Home' ||
                      e.key === 'End' ||
                      e.key.startsWith('Arrow')
                    ) {
                      e.preventDefault()
                    }
                  }}
                  onPaste={(e) => e.preventDefault()}
                  onClick={(e) => {
                    const el = e.currentTarget
                    el.setSelectionRange(el.value.length, el.value.length)
                  }}
                  maxLength={text.length}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="Type the text shown above"
                  className="absolute inset-0 size-full resize-none opacity-0"
                />
              </div>

              <Keyboard pressed={pressed} next={nextKey} />

              <div className="mt-10">
                <Hints onRestart={restart} />
              </div>
            </motion.div>
          ) : (
            result && (
              /* ---------------- Results view ---------------- */
              <motion.div
                key="results"
                className="flex flex-col items-center text-center"
                {...viewMotion}
              >
                <motion.div {...fadeUp(0)}>
                  <Hints onRestart={restart} />
                </motion.div>

                <motion.p
                  data-keep
                  className="mt-12 text-[7rem] leading-none text-white tabular-nums"
                  style={{ fontFamily: PIXEL_FONT, fontWeight: 400 }}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1, transition: { duration: 0.8, ease, delay: 0.1 } }}
                >
                  {result.wpm}
                </motion.p>
                <motion.p
                  data-keep
                  className="mt-5 text-xs tracking-[0.2em] text-white/45 uppercase"
                  {...fadeUp(0.2)}
                >
                  words per minute
                </motion.p>

                <motion.div data-keep className="mt-10 flex items-start gap-12" {...fadeUp(0.3)}>
                  <Stat pixel label="accuracy" value={result.acc} unit="%" />
                  <Stat pixel label="raw" value={result.raw} />
                  <Stat pixel label="errors" value={result.errors} />
                  <Stat pixel label="time" value={result.time.toFixed(1)} unit="s" />
                </motion.div>

                <motion.p data-keep className="mt-8 text-sm text-white/45" {...fadeUp(0.4)}>
                  <span className={beat ? 'text-emerald-400' : ''}>{beat ? '✓' : '×'}</span>{' '}
                  {beat
                    ? 'you beat amiel'
                    : fastEnough
                      ? `fast enough, but you need ${MIN_ACCURACY_TO_BEAT}% accuracy to count`
                      : "you didn't beat amiel"}{' '}
                  · {AMIEL_WPM} wpm
                </motion.p>

                <motion.button
                  data-keep
                  type="button"
                  onClick={restart}
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm text-[#1a1a1a] transition-transform duration-300 hover:scale-[1.03] active:scale-95"
                  {...fadeUp(0.5)}
                >
                  <span aria-hidden="true">↻</span> try again
                </motion.button>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

/* ---------------------------------------------------------------- */
/* Floating button + modal (this is what App.jsx renders)            */
/* ---------------------------------------------------------------- */

export default function TypingTest() {
  const isDesktop = useIsDesktop()
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <>
      <AnimatePresence>
        {isDesktop && !open && (
          <motion.button
            key="fab"
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open typing test"
            title="Typing test"
            className="fixed right-8 bottom-8 z-40 grid size-12 place-items-center rounded-full border border-line bg-bg/80 text-muted shadow-lg backdrop-blur-md transition-colors duration-400 ease-soft hover:border-accent hover:text-accent"
            initial={{ opacity: 0, scale: 0.8, y: 12 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { duration: 0.6, ease, delay: 1.2 },
            }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
          >
            <KeyboardIcon />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDesktop && open && <TypingModal key="typing-modal" onClose={close} />}
      </AnimatePresence>
    </>
  )
}