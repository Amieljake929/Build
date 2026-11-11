import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { NAV_LINKS, RESUME_URL } from '../data/site'

const ease = [0.22, 1, 0.36, 1]

const menuLinkClass = ({ isActive }) =>
  `relative inline-block py-1 text-xl font-normal tracking-brand uppercase transition-[color,translate] duration-400 ease-soft hover:translate-x-1.5 hover:text-fg sm:text-2xl ${
    isActive ? 'text-fg' : 'text-muted'
  }`

// Shared by the two menu-button lines
const lineBase =
  'absolute left-2 h-px bg-fg transition-[translate,rotate,width] duration-500 ease-soft'

// Opens public/Amiel-Jake-Baril.pdf in a new tab
function ResumeLink() {
  return (
    <a
      className="ui-label link-line py-2 text-muted hover:text-fg"
      href={RESUME_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      Resume
    </a>
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
      className="relative z-60 flex items-center justify-between gap-x-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.3 }}
    >
      {/* Menu button: two lines (bottom one shorter) that turn into an X */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="site-sidebar"
        className="group relative z-3 -m-2 size-8"
      >
        <span
          className={`${lineBase} top-[calc(50%_-_4px)] w-[1.15rem] ${
            open ? 'translate-y-[3.5px] rotate-45' : ''
          }`}
        />
        <span
          className={`${lineBase} top-[calc(50%_+_3px)] ${
            open
              ? 'w-[1.15rem] -translate-y-[3.5px] -rotate-45'
              : 'w-[0.65rem] group-hover:w-[1.15rem]'
          }`}
        />
      </button>

      {/* Resume: same row as the menu button on every screen size */}
      <div className="relative z-0 flex items-center">
        <ResumeLink />
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Blurs everything behind the sidebar; click to close */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-1 bg-bg/30 backdrop-blur-xs"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease }}
              onClick={() => setOpen(false)}
            />

            <motion.aside
              key="sidebar"
              id="site-sidebar"
              className="fixed inset-y-0 left-0 z-2 flex w-[min(88vw,calc(clamp(1.25rem,6vw,5.5rem)_+_17rem))] flex-col border-r border-line bg-bg pt-[clamp(1.25rem,4vw,3.5rem)] pb-[calc(clamp(1.25rem,4vw,3.5rem)_+_env(safe-area-inset-bottom,0px))] ps-[clamp(1.25rem,6vw,5.5rem)] pe-8"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.7, ease }}
            >
              <div className="my-auto flex flex-col items-start gap-10">
                <nav className="flex flex-col items-start gap-6" aria-label="Primary">
                  {NAV_LINKS.map((link, i) => (
                    <motion.div
                      key={link.to}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        transition: { duration: 0.6, delay: 0.25 + i * 0.07, ease },
                      }}
                      exit={{ opacity: 0, transition: { duration: 0.2 } }}
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