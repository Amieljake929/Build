import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import { NAME, ROLES } from '../data/site'

const ease = [0.22, 1, 0.36, 1]
const ROLE_INTERVAL = 3200 // ms each role stays on screen

const CHARS = [...NAME.toUpperCase()]
const glyph = (char) => (char === ' ' ? '\u00A0' : char)

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

// A copy of the name used for the glitch colors. Styles live in index.css.
function GlitchLayer({ tone }) {
  return (
    <span className={`glitch-layer glitch-${tone}`} aria-hidden="true">
      {CHARS.map((char, i) => (
        <span key={i} className="inline-block whitespace-pre">
          {glyph(char)}
        </span>
      ))}
    </span>
  )
}

export default function Index() {
  const [roleIndex, setRoleIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setRoleIndex((i) => (i + 1) % ROLES.length), ROLE_INTERVAL)
    return () => clearInterval(id)
  }, [])

  return (
    <PageTransition>
      <div className="text-center">
        {/* ps-[0.4em] cancels the trailing letter-spacing so the text is truly centered */}
        <h1
          className="relative ps-[0.4em] text-[length:clamp(1.35rem,1rem_+_2.2vw,2.25rem)] leading-[1.2] font-light tracking-brand"
          aria-label={NAME}
        >
          <motion.span
            className="glitch-base inline-block"
            aria-hidden="true"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {CHARS.map((char, i) => (
              <motion.span
                key={i}
                className="inline-block whitespace-pre will-change-[transform,opacity,filter]"
                variants={letter}
              >
                {glyph(char)}
              </motion.span>
            ))}
          </motion.span>

          {/* Glitch layers: invisible until the burst, every 10 seconds */}
          <GlitchLayer tone="blood" />
          <GlitchLayer tone="dried" />
          <GlitchLayer tone="ghost" />
          <GlitchLayer tone="crimson" />
          <span className="glitch-lines" aria-hidden="true" />
          <span className="glitch-cuts" aria-hidden="true" />
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