import portrait from '../assets/portrait.jpg'
import { NAME } from '../data/site'

// Small avatar + name row under a page title. `extra` adds text after the name (e.g. date).
export default function AuthorLine({ extra }) {
  return (
    <div className="mt-5 flex items-center gap-3 text-sm tracking-[0.02em] text-muted">
      <img src={portrait} alt="" className="size-6 rounded-full object-cover" />
      <span>{NAME}</span>
      {extra && (
        <>
          <span aria-hidden="true">·</span>
          <span>{extra}</span>
        </>
      )}
    </div>
  )
}