import PageTransition from '../components/PageTransition'
import PageTitle from '../components/PageTitle'

// Placeholder content: replace these with your real tracks.
// Add an `href` (for example a Spotify link) to make a row clickable.
const TUNES = [
  { title: 'Track title', artist: 'Artist name', note: 'Why this one stays on repeat.' },
  { title: 'Track title', artist: 'Artist name', note: 'The song I code to late at night.' },
  { title: 'Track title', artist: 'Artist name', note: 'A throwback I never skip.' },
  { title: 'Track title', artist: 'Artist name', note: 'Best for focus mode.' },
  { title: 'Track title', artist: 'Artist name', note: 'Saved for rainy days.' },
]

const rowClass = 'group block border-t border-line py-[1.2rem]'

function RowContent({ tune, hasLink }) {
  return (
    <>
      <span className="flex items-baseline justify-between gap-4">
        <span
          className={`text-fg transition-colors duration-400 ease-soft ${
            hasLink ? 'group-hover:text-accent' : ''
          }`}
        >
          {tune.title}
        </span>
        <span className="flex shrink-0 items-baseline gap-2 text-xs tracking-[0.08em] text-muted">
          {tune.artist}
          {hasLink && (
            <span
              className="text-sm transition-all duration-400 ease-soft group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
              aria-hidden="true"
            >
              ↗
            </span>
          )}
        </span>
      </span>
      <span className="mt-2 block text-sm leading-[1.7] tracking-[0.02em] text-muted">
        {tune.note}
      </span>
    </>
  )
}

// A row is only clickable when it has an href
function TuneRow({ tune }) {
  if (!tune.href) {
    return (
      <div className={rowClass}>
        <RowContent tune={tune} hasLink={false} />
      </div>
    )
  }

  return (
    <a href={tune.href} target="_blank" rel="noopener noreferrer" className={rowClass}>
      <RowContent tune={tune} hasLink />
    </a>
  )
}

export default function Tunes() {
  return (
    <PageTransition>
      <section className="w-[min(100%,38rem)]">
        <PageTitle>Tunes</PageTitle>
        <p className="-mt-4 mb-8 text-sm leading-[1.7] tracking-[0.02em] text-muted">
          A few songs I keep coming back to.
        </p>

        <ul className="border-b border-line">
          {TUNES.map((tune, i) => (
            <li key={i}>
              <TuneRow tune={tune} />
            </li>
          ))}
        </ul>
      </section>
    </PageTransition>
  )
}