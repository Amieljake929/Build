import { Fragment } from 'react'
import { motion } from 'framer-motion'
import { SOCIALS } from '../data/site'

export default function Footer() {
  return (
    <motion.footer
      className="flex justify-center pt-4 max-sm:pt-2 max-sm:pb-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, delay: 1.4 }}
    >
      <nav
        className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5"
        aria-label="Social"
      >
        {SOCIALS.map((item, i) => {
          const external = item.external !== false
          return (
            <Fragment key={item.label}>
              {i > 0 && (
                <span className="ui-label select-none text-line" aria-hidden="true">
                  |
                </span>
              )}
              <a
                className="ui-label link-line py-2 text-muted hover:text-fg"
                href={item.href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {item.label}
              </a>
            </Fragment>
          )
        })}
      </nav>
    </motion.footer>
  )
}