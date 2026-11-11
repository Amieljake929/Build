import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import { USERNAME, X_URL, ROLES, BIO, FACTS, EMAIL, NOTES, POSTS } from '../data/site'

const ease = [0.22, 1, 0.36, 1]

// Parent: reveals its children one after another
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
}

// Each block fades in, rises and un-blurs
const item = {
  hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease } },
}

// Lists inside the right column reveal their rows with a smaller delay
const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const row = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

export default function Index() {
  const snippets = POSTS.slice(0, 3)

  // Status is hidden on this page only (it still exists in site.js).
  const facts = FACTS.filter((fact) => fact.label !== 'Status')

  return (
    <PageTransition>
      {/* zoom: 0.9 makes this page look like 90% scale at normal browser zoom.
          The Header is outside this section, so it keeps its size. */}
      <motion.section
        className="grid w-full gap-16 pt-6 pb-10 [zoom:0.9] lg:grid-cols-2 lg:gap-24 lg:pt-10"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* ---------- Left: intro + details ---------- */}
        <motion.div className="min-w-0" variants={container}>
          <motion.h1
            variants={item}
            className="text-[length:clamp(1.75rem,1.3rem_+_1.4vw,2.5rem)] font-light tracking-[0.01em]"
          >
            {/* Opens my X (Twitter) account in a new tab */}
            <a
              href={X_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-400 ease-soft hover:text-accent"
            >
              {USERNAME}
            </a>
          </motion.h1>
          <motion.p variants={item} className="ui-label mt-4 text-muted">
            {ROLES.join('  /  ')}
          </motion.p>

          <motion.span
            variants={item}
            className="my-8 block h-px w-10 bg-accent"
            aria-hidden="true"
          />

          <motion.div
            variants={item}
            className="max-w-[32rem] space-y-4 leading-[1.85] tracking-[0.02em] text-muted no-underline"
          >
            {BIO.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </motion.div>

          {/* Based in, Email */}
          <motion.dl
            variants={item}
            className="mt-10 grid max-w-[32rem] gap-3 border-t border-line pt-6 text-sm"
          >
            {facts.map((fact) => (
              <div key={fact.label} className="grid grid-cols-[6rem_1fr] gap-4">
                <dt className="ui-label self-center text-muted">{fact.label}</dt>
                <dd className="tracking-[0.02em] text-fg">{fact.value}</dd>
              </div>
            ))}
            <div className="grid grid-cols-[6rem_1fr] gap-4">
              <dt className="ui-label self-center text-muted">Email</dt>
              <dd>
                <a href={`mailto:${EMAIL}`} className="link-line tracking-[0.02em] text-fg">
                  {EMAIL}
                </a>
              </dd>
            </div>
          </motion.dl>
        </motion.div>

        {/* ---------- Right: notes + blog ---------- */}
        <motion.div className="min-w-0 space-y-14" variants={container}>
          {/* Notes: two columns, square bullets, each links to its own page */}
          <motion.section variants={item}>
            <h2 className="mb-6 text-xl font-medium text-fg">Notes</h2>
            <motion.ul className="gap-x-10 sm:columns-2" variants={list}>
              {NOTES.map((note) => (
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