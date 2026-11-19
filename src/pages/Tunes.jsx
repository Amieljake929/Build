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

// Minimal pill-style scrollbar for this page only (applied to <html> while Tunes is mounted).
// Thin track + rounded thumb, no arrows. Both fade in while scrolling and fade out smoothly
// ~0.9s after the visitor stops. Thumb color is #f5945c.
const scrollCss = `
html.tunes-page { scrollbar-width: thin; scrollbar-color: transparent transparent; }
html.tunes-page[data-scrolling="true"] { scrollbar-color: #f5945c transparent; }
@supports selector(::-webkit-scrollbar) {
  html.tunes-page { scrollbar-width: auto; scrollbar-color: auto; }
  html.tunes-page::-webkit-scrollbar { width: 12px; }
  html.tunes-page::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
  html.tunes-page::-webkit-scrollbar-corner { background: transparent; }
  html.tunes-page::-webkit-scrollbar-track {
    background-color: transparent;
    border-radius: 999px;
    transition: background-color 0.5s ease;
  }
  html.tunes-page::-webkit-scrollbar-thumb {
    background-color: transparent;
    background-clip: padding-box;
    border: 3px solid transparent;
    border-radius: 999px;
    transition: background-color 0.5s ease;
  }
  html.tunes-page[data-scrolling="true"]::-webkit-scrollbar-track { background-color: rgb(128 128 128 / 0.12); }
  html.tunes-page[data-scrolling="true"]::-webkit-scrollbar-thumb,
  html.tunes-page::-webkit-scrollbar-thumb:hover,
  html.tunes-page::-webkit-scrollbar-thumb:active { background-color: #f5945c; }
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
function SpotifyPlayer({ uri, fallbackUrl }) {
  const hostRef = useRef(null)
  const controllerRef = useRef(null)
  const playingRef = useRef(false)
  const uriRef = useRef(uri)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  // The placeholder is removed from the DOM completely once the real player is shown
  const [skeletonGone, setSkeletonGone] = useState(false)

  useEffect(() => {
    let cancelled = false
    const host = hostRef.current
    const mount = document.createElement('div')
    host.appendChild(mount)

    // Never keep the placeholder forever, even if the "ready" event is missed
    const fallbackTimer = setTimeout(() => {
      if (!cancelled) setReady(true)
    }, 5000)

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

  // Once the real player is ready: quick fade, then remove the placeholder entirely
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setSkeletonGone(true), 300)
    return () => clearTimeout(t)
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
    <div className="relative min-h-[152px]">
      <div
        ref={hostRef}
        className="min-h-[152px] overflow-hidden rounded-[12px] [color-scheme:light] [&_iframe]:block [&_iframe]:rounded-[12px] [&_iframe]:[color-scheme:light]"
      />
      {!skeletonGone && (
        <PlayerSkeleton
          className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
            ready ? 'opacity-0' : 'opacity-100'
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

  // The page itself scrolls (left side stays sticky), so the whole Top Tracks list is
  // always reachable with no cut-off. The styled scrollbar is applied to <html> only
  // while this page is open, and shows while scrolling / fades out when idle.
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('tunes-page')
    let timer
    const onScroll = () => {
      root.dataset.scrolling = 'true'
      clearTimeout(timer)
      timer = setTimeout(() => {
        root.dataset.scrolling = 'false'
      }, 900)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
      root.classList.remove('tunes-page')
      delete root.dataset.scrolling
    }
  }, [])

  const topReady = top && !top.unavailable
  const profile = topReady ? top.profile : FALLBACK_PROFILE
  const track = now?.track
  const isPlaying = Boolean(now?.isPlaying) && !now?.stale

  return (
    <PageTransition>
      <style>{scrollCss}</style>

      <PageTitle>Tunes</PageTitle>

      {/* Empty spacer: same height the old subtitle used, so nothing below moves */}
      <div className="h-[2.99rem]" aria-hidden="true" />

      {/* lg:[zoom:1.1] = left/right content look like 110% browser zoom (title and menu stay 100%) */}
      <div className="mx-auto grid w-full max-w-[64rem] gap-14 pb-16 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-24 lg:[zoom:1.1]">
        {/* Left: profile + listen-only player (stays in place while the page scrolls) */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Profile profile={profile} />

          <div className="mt-10 pt-8">
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

        {/* Right: top artists and tracks (full list, no cut-off).
            lg:[zoom:0.9] = shrinks only this column, so it looks like 90% browser zoom while the page stays at 100% */}
        <div className="flex min-w-0 flex-col gap-12 lg:[zoom:0.9]">
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
    </PageTransition>
  )
}