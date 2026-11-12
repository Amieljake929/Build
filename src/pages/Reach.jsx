import PageTransition from '../components/PageTransition'
import { EMAIL, LOCATION, FACTS, SOCIALS, RESUME_URL } from '../data/site'

const titleClass =
  'text-[length:clamp(1.1rem,1rem_+_0.6vw,1.5rem)] font-light tracking-brand uppercase'

export default function Reach() {
  const status = FACTS.find((f) => f.label === 'Status')?.value
  // Email is already shown above, so skip it in the social list
  const socials = SOCIALS.filter((s) => s.label !== 'Email')

  return (
    <PageTransition>
      <section className="w-[min(100%,38rem)]">
        <h1 className={`mb-9 ${titleClass}`}>Reach</h1>

        <p className="max-w-[32rem] leading-[1.85] tracking-[0.02em] text-muted">
          Have a project, an internship opportunity or just want to say hello? Send me an
          email and I&apos;ll get back to you as soon as I can.
        </p>

        <a
          href={`mailto:${EMAIL}`}
          className="link-line mt-8 inline-block text-lg tracking-[0.02em] text-fg"
        >
          {EMAIL}
        </a>

        <dl className="mt-10 grid gap-3 border-t border-line pt-6 text-sm">
          <div className="grid grid-cols-[6rem_1fr] gap-4">
            <dt className="ui-label self-center text-muted">Based in</dt>
            <dd className="tracking-[0.02em] text-fg">{LOCATION}</dd>
          </div>
          {status && (
            <div className="grid grid-cols-[6rem_1fr] gap-4">
              <dt className="ui-label self-center text-muted">Status</dt>
              <dd className="tracking-[0.02em] text-fg">{status}</dd>
            </div>
          )}
        </dl>

        <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-2">
          {/* Resume: opens public/Amiel-Jake-Baril.pdf in a new tab */}
          <li>
            <a
              href={RESUME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-label link-line py-2 text-muted hover:text-fg"
            >
              Resume
            </a>
          </li>

          {socials.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-label link-line py-2 text-muted hover:text-fg"
              >
                {social.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </PageTransition>
  )
}