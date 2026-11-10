import PageTransition from '../components/PageTransition'
import { POSTS } from '../data/site'

export default function Blog() {
  return (
    <PageTransition>
      <section className="w-[min(100%,38rem)]">
        <h1 className="mb-9 text-[length:clamp(1.1rem,1rem_+_0.6vw,1.5rem)] font-light tracking-brand uppercase">
          Blog
        </h1>
        <ul className="border-b border-line">
          {POSTS.map((post) => (
            <li key={post.title}>
              <a
                href={post.href}
                className="flex items-baseline justify-between gap-4 border-t border-line py-[1.2rem] text-muted transition-[padding-inline-start,color] duration-500 ease-soft hover:ps-[0.9rem] hover:text-fg max-sm:flex-col max-sm:items-start max-sm:gap-1.5"
              >
                <span className="text-[0.8125rem] tracking-brand uppercase">{post.title}</span>
                <span className="text-xs tracking-[0.08em] sm:text-right">{post.meta}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </PageTransition>
  )
}