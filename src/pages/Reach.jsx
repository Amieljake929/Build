import { useEffect, useRef, useState } from 'react'
import PageTransition from '../components/PageTransition'
import { EMAIL } from '../data/site'

export default function Reach() {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      window.location.href = `mailto:${EMAIL}`
    }
  }

  return (
    <PageTransition>
      <section className="w-[min(100%,38rem)]">
        <h1 className="mb-9 text-[length:clamp(1.1rem,1rem_+_0.6vw,1.5rem)] font-light tracking-brand uppercase">
          Reach
        </h1>
        <p className="max-w-[34rem] leading-[1.85] tracking-[0.02em] text-muted">
          {/* TODO: your availability / preferred way to be contacted */}
          Placeholder: open for freelance projects and collaborations. The best way to reach me
          is by email.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-6">
          <button
            type="button"
            onClick={copyEmail}
            aria-live="polite"
            className="ui-label border border-fg py-4 ps-[calc(1.6rem_+_0.2em)] pe-[1.6rem] transition-[background-color,color,scale] duration-500 ease-soft hover:bg-fg hover:text-bg active:scale-[0.97]"
          >
            {copied ? 'Copied' : 'Copy email'}
          </button>
          <a className="ui-label link-line py-2 text-muted hover:text-fg" href={`mailto:${EMAIL}`}>
            Send email
          </a>
        </div>
      </section>
    </PageTransition>
  )
}