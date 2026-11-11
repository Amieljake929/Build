import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import { NAME, NAME_KO, ROLES } from '../data/site'

const ease = [0.22, 1, 0.36, 1]
const ROLE_INTERVAL = 3200 // ms each role stays on screen
const SWAP_DELAY = 80 // ms into the glitch when the text actually changes
const GLITCH_INTERVAL = 15000 // ms between automatic glitches

const toChars = (text) => [...text.toUpperCase()]
const glyph = (char) => (char === ' ' ? '\u00A0' : char)
const NAME_CHARS = toChars(NAME) // also used as an invisible sizer, see below

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
}

const letter = {
  hidden: { opacity: 0, y: '0.35em', filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease },
  },
}

// The visible name. Letters reveal one by one on first load (animated),
// then switch to plain letters once the name has changed language.
function Letters({ chars, animated }) {
  if (animated) {
    return (
      <motion.span
        className="glitch-base inline-block"
        aria-hidden="true"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {chars.map((char, i) => (
          <motion.span
            key={i}
            className="inline-block whitespace-pre will-change-[transform,opacity,filter]"
            variants={letter}
          >
            {glyph(char)}
          </motion.span>
        ))}
      </motion.span>
    )
  }

  return (
    <span className="glitch-base inline-block" aria-hidden="true">
      {chars.map((char, i) => (
        <span key={i} className="inline-block whitespace-pre">
          {glyph(char)}
        </span>
      ))}
    </span>
  )
}

// A copy of the name used for the glitch colors. Styles live in index.css.
function GlitchLayer({ tone, chars }) {
  return (
    <span className={`glitch-layer glitch-${tone}`} aria-hidden="true">
      {chars.map((char, i) => (
        <span key={i} className="inline-block whitespace-pre">
          {glyph(char)}
        </span>
      ))}
    </span>
  )
}

export default function Index() {
  const [roleIndex, setRoleIndex] = useState(0)
  const [lang, setLang] = useState('en') // 'en' | 'ko'
  const [glitching, setGlitching] = useState(false)
  const [touched, setTouched] = useState(false)
  const swapTimer = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setRoleIndex((i) => (i + 1) % ROLES.length), ROLE_INTERVAL)
    return () => clearInterval(id)
  }, [])

  useEffect(() => () => clearTimeout(swapTimer.current), [])

  // Automatic glitch every 15 seconds (the text stays as it is)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setGlitching(true), GLITCH_INTERVAL)
    return () => clearInterval(id)
  }, [])

  // Glitch, and change the text a moment in so the swap hides inside the burst
  const switchTo = (next) => {
    clearTimeout(swapTimer.current)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setTouched(true)
      setLang(next)
      return
    }
    setGlitching(true)
    swapTimer.current = setTimeout(() => {
      setTouched(true)
      setLang(next)
    }, SWAP_DELAY)
  }

  const endGlitch = (e) => {
    if (e.animationName === 'glitch-base') setGlitching(false)
  }

  // Mouse/pen: hover. Touch: tap to toggle (touch has no real hover).
  const onEnter = (e) => e.pointerType !== 'touch' && switchTo('ko')
  const onLeave = (e) => e.pointerType !== 'touch' && switchTo('en')
  const onUp = (e) => e.pointerType === 'touch' && switchTo(lang === 'en' ? 'ko' : 'en')

  const text = lang === 'ko' ? NAME_KO : NAME
  const chars = toChars(text)

  return (
    <PageTransition>
      <div className="text-center">
        {/* ps-[0.4em] cancels the trailing letter-spacing so the text is truly centered */}
        <h1
          className={`relative ps-[0.4em] text-[length:clamp(1.35rem,1rem_+_2.2vw,2.25rem)] leading-[1.2] font-light tracking-brand${
            glitching ? ' glitching' : ''
          }`}
          lang={lang}
          aria-label={text}
          onPointerEnter={onEnter}
          onPointerLeave={onLeave}
          onPointerUp={onUp}
          onAnimationEnd={endGlitch}
        >
          {/* Invisible English copy: keeps the hover area the same size in both languages */}
          <span className="invisible block h-0 overflow-hidden whitespace-nowrap" aria-hidden="true">
            {NAME_CHARS.map(glyph).join('')}
          </span>

          <span className="glitch-flash" aria-hidden="true" />

          <Letters chars={chars} animated={!touched} />

          {/* Glitch layers: invisible until the name changes */}
          <GlitchLayer tone="blood" chars={chars} />
          <GlitchLayer tone="dried" chars={chars} />
          <GlitchLayer tone="crimson" chars={chars} />
          <GlitchLayer tone="ember" chars={chars} />
        </h1>

        <motion.p
          className="mt-6 ps-[0.4em] text-[length:clamp(0.75rem,0.65rem_+_0.5vw,1rem)] font-light tracking-brand text-muted uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: 1.1, ease }}
        >
          {/* Screen readers get the full list once instead of every swap */}
          <span className="sr-only">{ROLES.join(' and ')}</span>
          <span className="inline-block" aria-hidden="true">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={ROLES[roleIndex]}
                className="inline-block"
                initial={{ opacity: 0, y: '0.5em', filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: '-0.5em', filter: 'blur(4px)' }}
                transition={{ duration: 0.6, ease }}
              >
                {ROLES[roleIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.p>
      </div>
    </PageTransition>
  )
}