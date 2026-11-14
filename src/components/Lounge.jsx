import { lazy, Suspense, useEffect } from 'react'
import { motion } from 'framer-motion'
import LoungeChat from './LoungeChat'
import LoungeStars from './LoungeStars'
import useDesktop from '../hooks/useDesktop'

// The globe (and its map data) only downloads when it is needed
const LoungeGlobe = lazy(() => import('./LoungeGlobe'))

const ease = [0.22, 1, 0.36, 1]

// ---- Credit (bottom right of the modal) ----
const CREDIT_NAME = 'Bryl Lim'
const CREDIT_URL = 'https://bryllim.com'

// Small credit in the bottom-right corner, same as the typing test
function Credit() {
  const name = CREDIT_URL ? (
    <a
      href={CREDIT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="text-white/60 underline decoration-white/20 underline-offset-4 transition-colors duration-300 hover:text-white hover:decoration-white/60"
    >
      {CREDIT_NAME}
    </a>
  ) : (
    <span className="text-white/60">{CREDIT_NAME}</span>
  )

  return (
    <motion.p
      data-keep
      className="fixed right-6 bottom-5 text-xs text-white/35 lg:right-8 lg:bottom-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease, delay: 0.5 } }}
    >
      design inspired by {name}
    </motion.p>
  )
}

export default function Lounge({ onClose }) {
  // The globe is desktop only. Phones and tablets get the chat alone.
  const desktop = useDesktop()

  // Scroll lock + Esc to close
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-[#1a1a1a]/70 px-5 py-14 backdrop-blur-lg"
      style={{ fontFamily: "'Geist', 'Geist Variable', ui-sans-serif, system-ui, sans-serif" }}
      role="dialog"
      aria-modal="true"
      aria-label="Lounge"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease }}
      onClick={(e) => {
        // Clicking empty space closes; clicking the chat, globe or credit (data-keep) does not
        if (!e.target.closest('[data-keep]')) onClose()
      }}
    >
      {/* Outer space: stars over the blurred page */}
      <LoungeStars />

      {/* Phones have no Esc key, so hint at the tap-outside gesture */}
      <p className="pointer-events-none absolute inset-x-0 top-5 z-10 text-center text-[0.7rem] text-white/30 lg:hidden">
        tap outside to close
      </p>

      {/* Desktop: chat on the left, globe on the right. Phones: a narrow centered chat. */}
      <motion.div
        className={`relative z-10 ${
          desktop
            ? 'grid w-full max-w-[72rem] grid-cols-[minmax(0,32rem)_minmax(0,1fr)] items-center gap-10'
            : 'w-full max-w-[18.5rem] sm:max-w-[32rem]'
        }`}
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease, delay: 0.05 }}
      >
        <div data-keep>
          <LoungeChat />
        </div>

        {desktop && (
          <div className="min-w-0">
            <Suspense fallback={null}>
              <LoungeGlobe />
            </Suspense>
          </div>
        )}
      </motion.div>

      <Credit />
    </motion.div>
  )
}