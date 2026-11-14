import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import { USERNAME, X_URL, ROLES, BIO, NOTES, POSTS } from '../data/site'

const ease = [0.22, 1, 0.36, 1]

// How many notes the home page shows (the rest live on the Notes page)
const HOME_NOTES = 8

// Words in the bio that become links (matched exactly as written, case-sensitive)
const BIO_LINKS = {
  Figma: 'https://www.figma.com/',
  Vercel: 'https://vercel.com/',
}
const BIO_LINK_PATTERN = new RegExp(`(${Object.keys(BIO_LINKS).join('|')})`)

// Turns a bio paragraph into text with clickable words
function renderBio(text) {
  return text.split(BIO_LINK_PATTERN).map((part, i) =>
    Object.hasOwn(BIO_LINKS, part) ? (
      <a
        key={i}
        href={BIO_LINKS[part]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#f5945c] no-underline transition-opacity duration-300 hover:opacity-75"
      >
        {part}
      </a>
    ) : (
      part
    ),
  )
}

// Parent: reveals its children one after another
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
}

// Right column starts a little after the left one
const containerRight = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.55 } },
}

// Each block fades in, rises and un-blurs
const item = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1, ease } },
}

// Heading slides up from behind its own line (masked by overflow-hidden)
const heading = {
  hidden: { y: '110%' },
  show: { y: 0, transition: { duration: 1.1, ease } },
}

// The orange line draws in from the left
const line = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 0.9, ease } },
}

// Lists inside the right column reveal their rows with a smaller delay
const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const row = {
  hidden: { opacity: 0, x: 14 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease } },
}

export default function Index() {
  const snippets = POSTS.slice(0, 3)
  const homeNotes = NOTES.slice(0, HOME_NOTES)
  const hasMoreNotes = NOTES.length > HOME_NOTES

  // Start the animation only after Geist is loaded, so the text never
  // changes font in the middle of it. The 1.5s timeout is a safety net.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    const start = () => alive && setReady(true)
    if (document.fonts?.load) {
      Promise.race([
        document.fonts.load('1em Geist'),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]).then(start, start)
    } else {
      start()
    }
    return () => {
      alive = false
    }
  }, [])

  return (
    <PageTransition>
      {/* lg:items-center vertically centers the left intro against the right column.
          The desktop scale lives in index.css (html font-size). */}
      <motion.section
        className="grid w-full gap-16 pt-6 pb-10 lg:grid-cols-2 lg:items-center lg:gap-24 lg:pt-10"
        variants={container}
        initial="hidden"
        animate={ready ? 'show' : 'hidden'}
      >
        {/* ---------- Left: intro ----------
            [container-type:inline-size] lets the role line size itself
            to this column's width (see role-line in index.css). */}
        <motion.div className="min-w-0 [container-type:inline-size]" variants={container}>
          <h1 className="overflow-hidden pb-1 text-[length:clamp(1.75rem,1.3rem_+_1.4vw,2.5rem)] font-light tracking-[0.01em]">
            <motion.span variants={heading} className="block">
              {/* Opens my X (Twitter) account in a new tab */}
              <a
                href={X_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-400 ease-soft hover:text-accent"
              >
                {USERNAME}
              </a>
            </motion.span>
          </h1>
          <motion.p variants={item} className="role-line mt-4 text-muted">
            {ROLES.join('  /  ')}
          </motion.p>

          <motion.span
            variants={line}
            className="my-8 block h-px w-10 origin-left bg-accent"
            aria-hidden="true"
          />

          <motion.div
            variants={item}
            className="max-w-[32rem] space-y-4 leading-[1.85] tracking-[0.02em] text-muted no-underline"
          >
            {BIO.map((paragraph, i) => (
              <p key={i}>{renderBio(paragraph)}</p>
            ))}
          </motion.div>
        </motion.div>

        {/* ---------- Right: notes + blog ---------- */}
        <motion.div className="min-w-0 space-y-14" variants={containerRight}>
          {/* Notes: first 8 only, two columns, square bullets, each links to its own page */}
          <motion.section variants={item}>
            <h2 className="mb-6 text-xl font-medium text-fg">Notes</h2>
            <motion.ul className="gap-x-10 sm:columns-2" variants={list}>
              {homeNotes.map((note) => (
                <motion.li
                  key={note.slug}
                  variants={row}
                  className="mb-3.5 break-inside-avoid"
                >
                  <Link
                    to={`/notes/${note.slug}`}
                    className="group flex items-baseline gap-3 text-muted transition-colors duration-400 ease-soft hover:text-fg"
                  >
                    <span
                      className="size-1.5 shrink-0 -translate-y-px bg-muted/60 transition-colors duration-400 group-hover:bg-accent"
                      aria-hidden="true"
                    />
                    <span>{note.title}</span>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>

            {/* Only appears when there are more notes than the home page shows */}
            {hasMoreNotes && (
              <Link
                to="/notes"
                className="link-line mt-4 inline-block text-sm tracking-[0.02em] text-muted hover:text-fg"
              >
                All notes →
              </Link>
            )}
          </motion.section>

          {/* Blog: latest 3, each opens its own post */}
          <motion.section variants={item}>
            <h2 className="mb-6 text-xl font-medium text-fg">Blog</h2>
            <motion.ul className="space-y-6" variants={list}>
              {snippets.map((post) => (
                <motion.li key={post.slug} variants={row}>
                  <Link to={`/blog/${post.slug}`} className="group block">
                    <span className="flex items-baseline justify-between gap-4">
                      <span className="text-fg transition-colors duration-400 ease-soft group-hover:text-accent">
                        {post.title}
                      </span>
                      <span className="shrink-0 text-xs tracking-[0.08em] text-muted">
                        {post.meta}
                      </span>
                    </span>
                    <span className="mt-2 line-clamp-2 block text-sm leading-[1.7] tracking-[0.02em] text-muted">
                      {post.excerpt}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>

            <Link
              to="/blog"
              className="link-line mt-8 inline-block text-sm tracking-[0.02em] text-muted hover:text-fg"
            >
              All posts →
            </Link>
          </motion.section>
        </motion.div>
      </motion.section>
    </PageTransition>
  )
}