import PageTransition from '../components/PageTransition'

const title =
  'mb-9 text-[length:clamp(1.1rem,1rem_+_0.6vw,1.5rem)] font-light tracking-brand uppercase'
const prose = 'max-w-[34rem] leading-[1.85] tracking-[0.02em] text-muted [&+&]:mt-5'

export default function Overview() {
  return (
    <PageTransition>
      <section className="w-[min(100%,38rem)]">
        <h1 className={title}>Overview</h1>
        <p className={prose}>
          {/* TODO: write your intro */}
          Placeholder: a short introduction about who you are, what you design, and the kind of
          work you enjoy most.
        </p>
        <p className={prose}>
          Placeholder: a few lines about your process, your tools, and what it is like to work
          with you.
        </p>
      </section>
    </PageTransition>
  )
}
