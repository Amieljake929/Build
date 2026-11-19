import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BadgeCheck, Globe, Info, MessageSquare, ShieldCheck, Volume2, X } from 'lucide-react'

const ease = [0.22, 1, 0.36, 1]
const ACCENT = '#f5945c'

// Everything the info panel says. Edit the text here.
const SECTIONS = [
  {
    icon: MessageSquare,
    title: 'chat',
    items: [
      'pick a name (letters and spaces, up to 20 characters) and say something, up to 280 characters.',
      'messages show up live for everyone, and older ones load as you scroll up.',
      'you get an anonymous account when you send your first message. no email, no password.',
      'rude words are masked with asterisks, and there is a short cooldown between messages to stop spam.',
      'the small icon next to the place shows the device a message was sent from.',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'privacy',
    items: [
      'messages are public. anyone who opens the lounge can read them, so please don’t share anything personal.',
      'each message saves your name, the text, your approximate city and country, the device type (phone or computer) and the time.',
      'your location is approximate, worked out from your internet connection. it is never GPS and never your exact address.',
      'your IP address isn’t saved with your messages.',
      'your name and a random id are kept in your own browser, so you don’t have to retype your name. that id is also what counts “people viewing now”.',
      'want a message removed? reach out to Amiel.',
    ],
  },
  {
    icon: Globe,
    title: 'the globe',
    items: [
      'the dots are real coastlines. drag to turn it, scroll to zoom, and double-click to fly back home to Quezon City.',
      'the orange pin is home. white pins are places visitors wrote from, with a light travelling along an arc to home. the pin marked “you” is your approximate spot.',
      'point at a pin to see the place and how many messages came from there. zoom in to see city names.',
      'desktop only: phones get the chat alone. the globe spins slowly when idle and holds still if your device asks for reduced motion.',
    ],
  },
  {
    icon: Volume2,
    title: 'Xaña',
    items: [
      'point at a message and tap the speaker to hear Xaña read it aloud in English or Tagalog. tap again to stop.',
      'she uses a female voice from your device. if your device has no Filipino voice, she falls back to English and Tagalog may sound off.',
      'if a cloud voice is turned on, only the message text is sent to a speech service to make the audio.',
    ],
  },
  {
    icon: BadgeCheck,
    title: 'Amiel',
    accent: true,
    items: [
      'Amiel is the owner of this site. the names Amiel, Amiel Jake, Amiel Baril and Amiel Jake Baril are reserved, and nobody else can use them. the database enforces it.',
      'his messages have an orange name, an orange outlined bubble, an orange avatar ring and a terminal icon instead of a device icon.',
    ],
  },
]

// The (i) button in the top right corner and the panel it opens.
// While the panel is open, the (i) turns into an X (close). When it closes, it turns back into the (i).
export default function LoungeInfo() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  // Esc closes the panel first, without closing the whole lounge
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open])

  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  const label = open ? 'Close about the lounge' : 'About the lounge'

  return (
    <>
      <button
        type="button"
        data-keep
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
        title={label}
        className={`fixed top-4 right-5 z-30 flex size-9 items-center justify-center overflow-hidden rounded-full border border-white/10 backdrop-blur-md transition-colors duration-300 hover:bg-white/10 hover:text-white lg:top-8 lg:right-8 ${
          open ? 'bg-white/10 text-white' : 'bg-white/5 text-white/55'
        }`}
      >
        {/* The icon swaps with a small spin: (i) <-> X */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'info'}
            className="flex items-center justify-center"
            initial={{ opacity: 0, rotate: open ? -90 : 90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1, transition: { duration: 0.2, ease } }}
            exit={{
              opacity: 0,
              rotate: open ? 90 : -90,
              scale: 0.6,
              transition: { duration: 0.15, ease },
            }}
          >
            {open ? (
              <X className="size-4" aria-hidden="true" />
            ) : (
              <Info className="size-4" aria-hidden="true" />
            )}
          </motion.span>
        </AnimatePresence>
      </button>

      {/* Clicking anywhere else closes the panel (and not the lounge) */}
      {open && <div data-keep className="fixed inset-0 z-20" onClick={() => setOpen(false)} />}

      <AnimatePresence>
        {open && (
          <motion.div
            key="info-panel"
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-label="About the lounge"
            data-keep
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease } }}
            exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.2, ease } }}
            className="fixed top-16 right-5 z-30 max-h-[calc(100dvh-6rem)] w-[min(24rem,calc(100vw-2.5rem))] overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1a1a]/90 p-5 shadow-2xl backdrop-blur-xl outline-none [scrollbar-width:none] lg:top-20 lg:right-8 [&::-webkit-scrollbar]:hidden"
          >
            <div>
              <h2 className="text-base font-medium text-white">about the lounge</h2>
              <p className="mt-1 text-xs leading-relaxed text-white/45">
                a small corner of the web where visitors say hi, and the globe shows where from.
              </p>
            </div>

            {SECTIONS.map(({ icon: Icon, title, items, accent }) => (
              <section key={title} className="mt-5">
                <h3
                  className="flex items-center gap-2 text-[0.8rem] font-medium text-white"
                  style={accent ? { color: ACCENT } : undefined}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {title}
                </h3>
                <ul className="mt-2 space-y-1.5 text-[0.78rem] leading-relaxed text-white/55">
                  {items.map((text) => (
                    <li key={text} className="flex gap-2">
                      <span
                        className="mt-[0.55em] size-1 shrink-0 rounded-full bg-white/25"
                        aria-hidden="true"
                      />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <p className="mt-5 text-[0.7rem] text-white/30">tip: press esc or tap outside to close.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}