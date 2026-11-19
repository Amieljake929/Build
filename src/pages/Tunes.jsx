import { useEffect, useRef, useState } from 'react'
import PageTransition from '../components/PageTransition'
import PageTitle from '../components/PageTitle'
import useSpotify from '../hooks/useSpotify'

// Shown when Spotify and the saved snapshot are both unavailable.
// Put your own Spotify profile link here (Spotify app > your profile > ... > Share > Copy link).
const FALLBACK_PROFILE = {
  name: 'Amiel',
  url: 'https://open.spotify.com',
  image: '',
}

const linkProps = { target: '_blank', rel: 'noopener noreferrer' }

// On desktop the page itself is locked (no page scroll) so only the right column scrolls.
// Applied to <html> only while Tunes is mounted. On mobile the page scrolls normally.
const pageCss = `
@media (min-width: 1024px) {
  html.tunes-page,
  html.tunes-page body {
    overflow: hidden;
  }
}
`

// ---- Spotify's official embed player (listen-only, controlled by the visitor) ----

let apiPromise
function loadSpotifyApi() {
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      if (window.__spotifyIFrameAPI) return resolve(window.__spotifyIFrameAPI)
      window.onSpotifyIframeApiReady = (api) => {
        window.__spotifyIFrameAPI = api
        resolve(api)
      }
      const script = document.createElement('script')
      script.src = 'https://open.spotify.com/embed/iframe-api/v1'
      script.async = true
      script.onerror = () => {
        apiPromise = undefined
        reject(new Error('Spotify player blocked'))
      }
      document.body.appendChild(script)
    })
  }
  return apiPromise
}

// Placeholder that looks like the player (cover + text lines) while it loads
function PlayerSkeleton({ className = '' }) {
  return (
    <div
      className={`flex h-[152px] animate-pulse gap-4 rounded-[12px] bg-line/40 p-4 ${className}`}
      aria-hidden="true"
    >
      <div className="size-[120px] shrink-0 rounded-lg bg-line" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
        <div className="h-4 w-3/4 rounded bg-line" />
        <div className="h-3 w-1/2 rounded bg-line/80" />
        <div className="mt-3 h-2.5 w-full rounded-full bg-line/70" />
      </div>
    </div>
  )
}

// Paused by default. When the song changes, the player loads the new one, and keeps
// playing only if the visitor was already listening.
//
// Loading is sequential so the placeholder and the real player never overlap:
//   1. placeholder is shown, the real player is invisible (but loading underneath)
//   2. player is ready -> short wait so the cover art can paint
//   3. placeholder fades out completely
//   4. real player fades in, placeholder is removed from the DOM
function SpotifyPlayer({ uri, fallbackUrl }) {
  const hostRef = useRef(null)
  const controllerRef = useRef(null)
  const playingRef = useRef(false)
  const uriRef = useRef(uri)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const [skeletonFading, setSkeletonFading] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  const [skeletonGone, setSkeletonGone] = useState(false)

  useEffect(() => {
    let cancelled = false
    const host = hostRef.current
    const mount = document.createElement('div')
    host.appendChild(mount)

    // Never keep the placeholder forever, even if the "ready" event is missed
    const fallbackTimer = setTimeout(() => {
      if (!cancelled) setReady(true)
    }, 4000)

    loadSpotifyApi()
      .then((api) => {
        if (cancelled) return
        api.createController(
          mount,
          { uri: uriRef.current, width: '100%', height: 152 },
          (controller) => {
            if (cancelled) {
              controller.destroy?.()
              return
            }
            controllerRef.current = controller
            controller.addListener('ready', () => {
              if (!cancelled) setReady(true)
            })
            controller.addListener('playback_update', (e) => {
              playingRef.current = !e.data.isPaused
            })
            // Also react to the iframe's own load event (helps on slow mobile networks)
            host.querySelector('iframe')?.addEventListener('load', () => {
              if (!cancelled) setReady(true)
            })
          },
        )
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      clearTimeout(fallbackTimer)
      controllerRef.current?.destroy?.()
      controllerRef.current = null
      host.innerHTML = ''
    }
  }, [])

  // Once the player is ready: wait a moment (cover art paints), fade the placeholder
  // out fully, THEN fade the player in and remove the placeholder.
  useEffect(() => {
    if (!ready) return
    const t1 = setTimeout(() => setSkeletonFading(true), 500)
    const t2 = setTimeout(() => setShowPlayer(true), 720)
    const t3 = setTimeout(() => setSkeletonGone(true), 1100)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [ready])

  useEffect(() => {
    uriRef.current = uri
    const controller = controllerRef.current
    if (!controller) return
    controller.loadUri(uri)
    if (playingRef.current) setTimeout(() => controller.play(), 400)
  }, [uri])

  if (failed) {
    return (
      <a
        href={fallbackUrl}
        {...linkProps}
        className="text-sm text-muted transition-colors duration-400 ease-soft hover:text-accent"
      >
        Open this song on Spotify ↗
      </a>
    )
  }

  return (
    <div className="relative h-[152px] w-full">
      {/* Real player: always in the DOM so it can load, invisible until it's time to show it */}
      <div
        ref={hostRef}
        className={`absolute inset-0 overflow-hidden rounded-[12px] transition-opacity duration-300 ease-out [color-scheme:light] [&_iframe]:block [&_iframe]:rounded-[12px] [&_iframe]:[color-scheme:light] ${
          showPlayer ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      {/* Placeholder: sits on top, fades out completely before the player fades in */}
      {!skeletonGone && (
        <PlayerSkeleton
          className={`pointer-events-none absolute inset-0 w-full transition-opacity duration-200 ease-out ${
            skeletonFading ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}
    </div>
  )
}

// ---- Small pieces ----

function Avatar({ src, name, className = '', round = true }) {
  const shape = round ? 'rounded-full' : 'rounded-sm'
  if (!src) {
    return (
      <span
        className={`${className} ${shape} flex shrink-0 items-center justify-center bg-line text-sm text-muted`}
        aria-hidden="true"
      >
        {name?.[0]?.toUpperCase() || '♪'}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className={`${className} ${shape} shrink-0 object-cover`}
    />
  )
}

function Profile({ profile }) {
  return (
    <a href={profile.url} {...linkProps} className="group flex items-center gap-5">
      <Avatar src={profile.image} name={profile.name} className="size-20" />
      <span className="min-w-0">
        <span className="block truncate text-xl text-fg transition-colors duration-400 ease-soft group-hover:text-accent">
          {profile.name}
        </span>
        <span className="mt-1 block text-xs tracking-[0.08em] text-muted">Open in Spotify ↗</span>
      </span>
    </a>
  )
}

function Row({ index, href, image, round, title, subtitle }) {
  return (
    <li>
      <a href={href} {...linkProps} className="group flex items-center gap-4 border-t border-line py-3">
        <span className="w-5 shrink-0 text-xs tabular-nums text-muted">{index + 1}</span>
        <Avatar src={image} name={title} round={round} className="size-11" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-fg transition-colors duration-400 ease-soft group-hover:text-accent">
            {title}
          </span>
          {subtitle && <span className="block truncate text-xs text-muted">{subtitle}</span>}
        </span>
        <span
          className="shrink-0 text-sm text-muted transition-all duration-400 ease-soft group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
          aria-hidden="true"
        >
          ↗
        </span>
      </a>
    </li>
  )
}

function ListSection({ title, label, children }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-medium text-fg">{title}</h2>
        {label && <span className="text-xs tracking-[0.08em] text-muted">{label}</span>}
      </div>
      <ul className="border-b border-line">{children}</ul>
    </section>
  )
}

const emptyText = 'Not enough listening history yet.'

// ---- Page ----

export default function Tunes() {
  const { top, now } = useSpotify()
  const gridRef = useRef(null)
  const [gridHeight, setGridHeight] = useState(null)

  // Desktop: lock the page scroll and give the grid a fixed height that fills the rest of
  // the screen, so everything stays steady and only the right column scrolls.
  // Mobile: nothing is locked, the page scrolls normally.
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('tunes-page')

    const mq = window.matchMedia('(min-width: 1024px)')
    const measure = () => {
      if (!mq.matches || !gridRef.current) {
        setGridHeight(null)
        return
      }
      window.scrollTo(0, 0)
      const top = gridRef.current.getBoundingClientRect().top
      setGridHeight(Math.max(320, Math.floor(window.innerHeight - top - 32)))
    }

    measure()
    // Measure again after the page transition has settled
    const settleTimer = setTimeout(measure, 800)
    window.addEventListener('resize', measure)

    return () => {
      clearTimeout(settleTimer)
      window.removeEventListener('resize', measure)
      root.classList.remove('tunes-page')
    }
  }, [])

  const topReady = top && !top.unavailable
  const profile = topReady ? top.profile : FALLBACK_PROFILE
  const track = now?.track
  const isPlaying = Boolean(now?.isPlaying) && !now?.stale

  return (
    <PageTransition>
      <style>{pageCss}</style>

      <PageTitle>Tunes</PageTitle>

      {/* Empty spacer: same height the old subtitle used, so nothing below moves */}
      <div className="h-[2.99rem]" aria-hidden="true" />

      {/* Zoom is applied to the inner content of each column (left 1.1, right 0.99 = 0.9 x 1.1),
          not to the grid, so the grid's height and the right column's scrolling stay exact. */}
      <div
        ref={gridRef}
        style={gridHeight ? { height: gridHeight } : undefined}
        className="mx-auto grid w-full max-w-[70rem] gap-14 pb-16 lg:grid-cols-[minmax(0,26.4rem)_minmax(0,1fr)] lg:gap-[6.6rem] lg:overflow-hidden lg:pb-0"
      >
        {/* Left: profile + listen-only player (steady, never scrolls on desktop) */}
        <div className="lg:self-start">
          <div className="lg:[zoom:1.1]">
            <Profile profile={profile} />

            <div className="mt-6">
              <p className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted">
                <span
                  className={`size-1.5 rounded-full ${isPlaying ? 'animate-pulse bg-accent' : 'bg-muted'}`}
                />
                {isPlaying ? 'Playing now' : 'Last played'}
              </p>

              {now === null && <PlayerSkeleton />}

              {track ? (
                <>
                  <SpotifyPlayer uri={track.uri} fallbackUrl={track.url} />
                  <p className="mt-3 text-xs leading-[1.7] text-muted">
                    Press play to listen. Play and pause only affect your own browser.
                  </p>
                </>
              ) : (
                now && (
                  <p className="text-sm text-muted">
                    My Spotify can&apos;t be reached right now. Check back soon.
                  </p>
                )
              )}
            </div>
          </div>
        </div>

        {/* Right: the ONLY scrollable area on desktop, with the scrollbar hidden */}
        <div className="min-w-0 overscroll-contain [scrollbar-width:none] lg:h-full lg:overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <div className="flex flex-col gap-12 lg:pb-8 lg:[zoom:0.99]">
            {top === null && <p className="text-sm text-muted">Loading…</p>}

            {top?.unavailable && (
              <p className="text-sm text-muted">
                My top artists and tracks can&apos;t be loaded right now. Check back soon.
              </p>
            )}

            {topReady && (
              <>
                <ListSection title="Top Artists" label={top.artists.label}>
                  {top.artists.items.length === 0 && (
                    <li className="border-t border-line py-3 text-sm text-muted">{emptyText}</li>
                  )}
                  {top.artists.items.map((a, i) => (
                    <Row key={a.id} index={i} href={a.url} image={a.image} title={a.name} />
                  ))}
                </ListSection>

                <ListSection title="Top Tracks" label={top.tracks.label}>
                  {top.tracks.items.length === 0 && (
                    <li className="border-t border-line py-3 text-sm text-muted">{emptyText}</li>
                  )}
                  {top.tracks.items.map((t, i) => (
                    <Row
                      key={t.id}
                      index={i}
                      href={t.url}
                      image={t.image}
                      round={false}
                      title={t.name}
                      subtitle={t.artists.map((a) => a.name).join(', ')}
                    />
                  ))}
                </ListSection>

                {top.stale && (
                  <p className="text-xs text-muted">
                    Showing a saved copy from{' '}
                    {new Date(top.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    .
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}