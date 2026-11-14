import { Link, Navigate, useParams } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import PageTitle from '../components/PageTitle'
import AuthorLine from '../components/AuthorLine'
import { POSTS } from '../data/site'

// /blog: list of all posts (same look as the Blog list on the landing page)
function PostList() {
  return (
    <PageTransition>
      <section className="w-[min(100%,38rem)]">
        <PageTitle>Blog</PageTitle>
        <ul className="border-b border-line">
          {POSTS.map((post) => (
            <li key={post.slug}>
              <Link
                to={`/blog/${post.slug}`}
                className="group block border-t border-line py-[1.2rem]"
              >
                <span className="flex items-baseline justify-between gap-4">
                  <span className="text-fg transition-colors duration-400 ease-soft group-hover:text-accent">
                    {post.title}
                  </span>
                  <span className="shrink-0 text-xs tracking-[0.08em] text-muted">
                    {post.meta}
                  </span>
                </span>
                <span className="mt-2 block text-sm leading-[1.7] tracking-[0.02em] text-muted">
                  {post.excerpt}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageTransition>
  )
}

// /blog/:slug: one full post. `body` items are paragraphs (strings) or { heading }.
function Post({ post }) {
  return (
    <PageTransition>
      <article className="w-[min(100%,42rem)]">
        <Link
          to="/blog"
          className="link-line mb-10 inline-block text-sm tracking-[0.02em] text-muted hover:text-fg"
        >
          ← All posts
        </Link>

        <h1 className="text-[length:clamp(1.75rem,1.4rem_+_1.4vw,2.5rem)] leading-tight font-semibold text-fg">
          {post.title}
        </h1>
        <AuthorLine extra={`${post.meta} · ${post.readTime}`} />

        <div className="mt-12 space-y-6 text-lg leading-[1.85] tracking-[0.01em] text-muted">
          {post.body.map((block, i) =>
            typeof block === 'string' ? (
              <p key={i}>{block}</p>
            ) : (
              <h2 key={i} className="pt-6 text-2xl font-semibold text-fg">
                {block.heading}
              </h2>
            ),
          )}
        </div>
      </article>
    </PageTransition>
  )
}

export default function Blog() {
  const { slug } = useParams()
  if (!slug) return <PostList />

  const post = POSTS.find((p) => p.slug === slug)
  if (!post) return <Navigate to="/blog" replace />
  return <Post post={post} />
}