import { Link } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import { BUILDS } from '../data/site'

const titleClass =
  'text-[length:clamp(1.1rem,1rem_+_0.6vw,1.5rem)] font-light tracking-brand uppercase'

// Row layout: name | category + description | arrow
const rowClass =
  'group grid items-start gap-x-6 gap-y-2 py-7 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_1.5rem] sm:items-center'

function RowContent({ build, hasLink }) {
  return (
    <>
      <h2 className="text-lg font-normal text-fg">{build.title}</h2>

      <div>
        <p className="ui-label text-muted">{build.category}</p>
        <p className="mt-3 text-sm leading-[1.8] tracking-[0.02em] text-muted transition-colors duration-400 ease-soft group-hover:text-fg">
          {build.description}
        </p>
      </div>

      {/* Arrow only shows when the project has a link */}
      <span
        className="hidden justify-self-end text-muted transition-all duration-400 ease-soft group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent sm:block"
        aria-hidden="true"
      >
        {hasLink ? '↗' : ''}
      </span>
    </>
  )
}

// Internal links (like "/") use <Link>; "#" means not set yet, so the row is not clickable
function BuildRow({ build }) {
  const { href } = build
  const hasLink = Boolean(href) && href !== '#'

  if (!hasLink) {
    return (
      <div className={rowClass}>
        <RowContent build={build} hasLink={false} />
      </div>
    )
  }

  if (href.startsWith('/')) {
    return (
      <Link to={href} className={rowClass}>
        <RowContent build={build} hasLink />
      </Link>
    )
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={rowClass}>
      <RowContent build={build} hasLink />
    </a>
  )
}

export default function Builds() {
  return (
    <PageTransition>
      <section className="w-[min(100%,38rem)]">
        <h1 className={`mb-9 ${titleClass}`}>Builds</h1>
        <ul className="border-b border-line">
          {BUILDS.map((build) => (
            <li key={build.title} className="border-t border-line">
              <BuildRow build={build} />
            </li>
          ))}
        </ul>
      </section>
    </PageTransition>
  )
}