import { Link, Navigate, useParams } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import PageTitle from '../components/PageTitle'
import AuthorLine from '../components/AuthorLine'
import { NOTES } from '../data/site'

const backClass =
  'link-line mb-10 inline-block text-sm tracking-[0.02em] text-muted hover:text-fg'

// /notes: list of all notes
function NoteList() {
  return (
    <PageTransition>
      <section className="w-[min(100%,38rem)]">
        <PageTitle>Notes</PageTitle>
        <ul className="border-b border-line">
          {NOTES.map((note) => (
            <li key={note.slug}>
              <Link
                to={`/notes/${note.slug}`}
                className="group block border-t border-line py-[1.2rem]"
              >
                <span className="flex items-baseline justify-between gap-4">
                  <span className="text-fg transition-colors duration-400 ease-soft group-hover:text-accent">
                    {note.title}
                  </span>

                  {/* Hint that the note opens and has more inside */}
                  <span
                    className="shrink-0 text-sm text-muted transition-[translate,color] duration-400 ease-soft group-hover:translate-x-1 group-hover:text-accent"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </span>

                <span className="mt-2 block text-sm leading-[1.7] tracking-[0.02em] text-muted">
                  {note.summary}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageTransition>
  )
}

// /notes/:slug: one note, laid out as sections with bullet lists
function Note({ note }) {
  return (
    <PageTransition>
      <article className="w-[min(100%,42rem)]">
        <Link to="/notes" className={backClass}>
          ← All notes
        </Link>

        <h1 className="text-[length:clamp(1.75rem,1.4rem_+_1.4vw,2.5rem)] leading-tight font-semibold text-fg">
          {note.title}
        </h1>
        <AuthorLine />

        <div className="mt-12 space-y-12">
          {note.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-semibold text-fg">{section.heading}</h2>
              <ul className="mt-6 space-y-3.5">
                {section.points.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-4 text-lg leading-[1.6] text-fg"
                  >
                    <span
                      className="mt-[0.7em] size-1.5 shrink-0 bg-muted/60"
                      aria-hidden="true"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </article>
    </PageTransition>
  )
}

export default function Notes() {
  const { slug } = useParams()
  if (!slug) return <NoteList />

  const note = NOTES.find((n) => n.slug === slug)
  if (!note) return <Navigate to="/notes" replace />
  return <Note note={note} />
}