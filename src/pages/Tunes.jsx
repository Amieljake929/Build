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
  followers: null,
}

const linkProps = { target: '_blank', rel: 'noopener noreferrer' }

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

// Paused by default. When the song changes, the player loads the new one, and keeps
// playing only if the visitor was already listening.
function SpotifyPlayer({ uri, fallbackUrl }) {
  const hostRef = useRef(null)
  const controllerRef = useRef(null)
  const playingRef = useRef(false)
  const uriRef = useRef(uri)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const host = hostRef.current
    const mount = document.createElement('div')
    host.appendChild(mount)

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
      controllerRef.current?.destroy?.()
      controllerRef.current = null
      host.innerHTML = ''
    }
  }, [])

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

  return <div ref={hostRef} className="min-h-[152px] overflow-hidden rounded-xl" />
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
        {profile.followers != null && (
          <span className="mt-1 block text-sm text-muted">
            {profile.followers.toLocaleString()} {profile.followers === 1 ? 'follower' : 'followers'}
          </span>
        )}
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

  const topReady = top && !top.unavailable
  const profile = topReady ? top.profile : FALLBACK_PROFILE
  const track = now?.track
  const isPlaying = Boolean(now?.isPlaying) && !now?.stale

  return (
    <PageTransition>
      <PageTitle>Tunes</PageTitle>
      <p className="-mt-4 mb-10 text-sm leading-[1.7] tracking-[0.02em] text-muted">
        What I listen to, live from my Spotify.
      </p>

      <div className="grid w-full gap-14 pb-16 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-24">
        {/* Left: profile + listen-only player */}
        <div>
          <Profile profile={profile} />

          <div className="mt-10 border-t border-line pt-8">
            <p className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted">
              <span
                className={`size-1.5 rounded-full ${isPlaying ? 'animate-pulse bg-accent' : 'bg-muted'}`}
              />
              {isPlaying ? 'Playing now' : 'Last played'}
            </p>

            {now === null && <p className="text-sm text-muted">Loading…</p>}

            {track ? (
              <>
                <SpotifyPlayer uri={track.uri} fallbackUrl={track.url} />
                <p className="mt-3 text-xs leading-[1.7] text-muted">
                  Press play to listen. Play and pause only affect your own browser, never my
                  Spotify.
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

        {/* Right: top artists and tracks */}
        <div className="flex max-w-2xl flex-col gap-12">
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