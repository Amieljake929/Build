import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { NAV_LINKS } from '../data/site'

// Soft easing: gentle start, long smooth finish
const fadeEase = [0.32, 0.72, 0, 1]

// How far the sidebar drifts in from the left while it fades (px)
const SLIDE_DISTANCE = 40

// Links keep their text left-aligned.
const menuLinkClass = ({ isActive }) =>
  `relative inline-block py-1 text-xl font-normal tracking-brand uppercase transition-[color,translate] duration-400 ease-soft hover:translate-x-1.5 hover:text-fg sm:text-2xl ${
    isActive ? 'text-fg' : 'text-muted'
  }`

// Shared by the two menu-icon lines
const lineBase =
  'absolute left-2 h-px bg-fg transition-[translate,rotate,width] duration-500 ease-soft'

// The hamburger icon (two lines)
function MenuIcon() {
  return (
    <>
      <span className={`${lineBase} top-[calc(50%_-_4px)] w-[1.15rem]`} />
      <span
        className={`${lineBase} top-[calc(50%_+_3px)] w-[0.65rem] group-hover:w-[1.15rem]`}
      />
    </>
  )
}

export default function Header() {
  const [open, setOpen] = useState(false)

  // Lock page scroll and allow Escape to close while the sidebar is open.
  // (index.css reserves the scrollbar gutter so the page does not shift.)
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <motion.header
      className="relative z-60 flex min-h-7 items-start justify-between gap-x-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.3 }}
    >
      {/* Menu button. It fades out while the sidebar is open (there is no close
          button: click/tap anywhere outside the sidebar, or press Esc, to close).
          To move it up/down, change `top-3` (e.g. top-4 = lower, top-2 = higher). */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="site-sidebar"
        aria-hidden={open}
        tabIndex={open ? -1 : 0}
        className={`menu-btn group relative top-3 z-5 -m-2 size-8 transition-opacity duration-300 ${
          open ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <MenuIcon />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Covers the whole page behind the sidebar: click/tap it to close. */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-1 bg-bg/40 backdrop-blur-xs"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: fadeEase }}
              onClick={() => setOpen(false)}
            />

            {/* Sidebar: slides in a little while fading (desktop + mobile).
                Mobile: 78% of the screen (max 18rem) so a strip of the page stays
                visible on the right; tap it to close. To change the mobile width,
                edit `w-[78vw] max-w-72`.
                Desktop: width = page margin + 14rem, link block centered in the
                sidebar (lg:mx-auto) with left-aligned text. */}
            <motion.aside
              key="sidebar"
              id="site-sidebar"
              className="fixed inset-y-0 left-0 z-4 flex w-[78vw] max-w-72 flex-col border-r border-line bg-bg pt-(--pad-top) pb-[calc(var(--pad-top)_+_env(safe-area-inset-bottom,0px))] ps-(--page-x) pe-6 lg:w-[calc(var(--page-x)_+_14rem)] lg:max-w-none lg:ps-0 lg:pe-0"
              initial={{ opacity: 0, x: -SLIDE_DISTANCE }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -SLIDE_DISTANCE }}
              transition={{ duration: 0.5, ease: fadeEase }}
            >
              <div className="my-auto flex flex-col items-start gap-10 lg:mx-auto">
                <nav className="flex flex-col items-start gap-6" aria-label="Primary">
                  {NAV_LINKS.map((link, i) => (
                    <div key={link.to}>
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.6, delay: 0.15 + i * 0.06, ease: fadeEase },
                        }}
                        exit={{ opacity: 0, transition: { duration: 0.25 } }}
                      >
                        <NavLink
                          to={link.to}
                          end={link.to === '/'}
                          className={menuLinkClass}
                          onClick={() => setOpen(false)}
                        >
                          {({ isActive }) => (
                            <>
                              {link.label}
                              {isActive && (
                                <span className="absolute -bottom-0.5 left-0 h-px w-5 bg-accent" />
                              )}
                            </>
                          )}
                        </NavLink>
                      </motion.div>
                    </div>
                  ))}
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  )
}