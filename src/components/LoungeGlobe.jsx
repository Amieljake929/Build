import { useEffect, useRef } from 'react'
import { feature } from 'topojson-client'
import { geoEquirectangular, geoPath } from 'd3-geo'
import land50 from 'world-atlas/land-50m.json'
import useVisitorPins from '../hooks/useVisitorPins'

const TAU = Math.PI * 2
const DEG = Math.PI / 180

// The portfolio's home: every arc points here
const HOME = { lat: 14.676, lng: 121.0437, label: 'Quezon City' }
const ACCENT = '#f5945c'

// Ocean colors: OCEAN_LIGHT is the lit spot (top-left), OCEAN_DARK is the far edge.
// Want it lighter? Raise both values. Want it darker? Lower them.
const OCEAN_LIGHT = '#393c45'
const OCEAN_DARK = '#131418'

// Glow around the globe. HALO_ALPHA is the strength (0 = no glow), HALO_SIZE is how far it reaches.
const HALO_ALPHA = 0.05
const HALO_SIZE = 1.22

const STEP = 0.9 // approx degrees between dots (smaller = more dots, finer coastlines)
const AUTO_SPEED = 0.035 // radians per second (a full turn takes about 3 minutes)
const MIN_ZOOM = 0.75
const MAX_ZOOM = 3.5
const LAT_LIMIT = 1.3
const MAX_PINS = 120
const LEVELS = 24 // brightness steps for land dots (more = smoother, no visible rings)
const FONT = '500 12px Geist, ui-sans-serif, system-ui, sans-serif'

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const wrapPi = (a) => ((((a + Math.PI) % TAU) + TAU) % TAU) - Math.PI

// lat/lng (degrees) -> point on the unit sphere
function toVec(lat, lng) {
  const p = lat * DEG
  const l = lng * DEG
  return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)]
}

/* ---------------------------------------------------------------- */
/* Land dots: real coastlines drawn to a hidden canvas, then sampled  */
/* ---------------------------------------------------------------- */

let DOTS
function getLandDots() {
  if (DOTS) return DOTS

  const W = 2048
  const H = 1024
  const mask = document.createElement('canvas')
  mask.width = W
  mask.height = H
  const mctx = mask.getContext('2d', { willReadFrequently: true })

  const projection = geoEquirectangular().scale(W / TAU).translate([W / 2, H / 2])
  mctx.fillStyle = '#fff'
  mctx.beginPath()
  geoPath(projection, mctx)(feature(land50, land50.objects.land))
  mctx.fill()
  const data = mctx.getImageData(0, 0, W, H).data

  // Evenly spread points over the whole sphere (Fibonacci lattice).
  // Unlike latitude rows, this has no visible bands, rings, or moire.
  const total = Math.round((4 * Math.PI) / Math.pow(STEP * DEG, 2))
  const GOLDEN = Math.PI * (3 - Math.sqrt(5))

  // Tiny deterministic jitter so the lattice never forms spiral patterns
  let seed = 1337
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296 - 0.5
  }

  const xs = []
  const ys = []
  const zs = []
  for (let i = 0; i < total; i++) {
    const y = 1 - (2 * (i + 0.5)) / total
    const lat = Math.asin(y) / DEG + rand() * STEP * 0.18
    let lng = (((i * GOLDEN) / DEG) % 360) + rand() * STEP * 0.18
    lng = ((((lng + 180) % 360) + 360) % 360) - 180

    if (lat < -86 || lat > 88) continue

    const px = Math.min(W - 1, Math.max(0, Math.floor(((lng + 180) / 360) * W)))
    const py = Math.min(H - 1, Math.max(0, Math.floor(((90 - lat) / 180) * H)))
    if (data[(py * W + px) * 4 + 3] > 100) {
      const [x, yy, z] = toVec(lat, lng)
      xs.push(x)
      ys.push(yy)
      zs.push(z)
    }
  }

  DOTS = { xs: Float32Array.from(xs), ys: Float32Array.from(ys), zs: Float32Array.from(zs), n: xs.length }
  return DOTS
}

/* ---------------------------------------------------------------- */
/* Arcs and scene                                                    */
/* ---------------------------------------------------------------- */

// A great-circle arc from a to b, lifted off the surface in the middle
function makeArc(a, b) {
  const dot = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1)
  const theta = Math.acos(dot)
  const sin = Math.sin(theta)
  if (theta < 0.02 || sin < 0.02) return null

  const N = 56
  const lift = 0.08 + 0.3 * (theta / Math.PI)
  const out = new Float32Array((N + 1) * 3)
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const w1 = Math.sin((1 - t) * theta) / sin
    const w2 = Math.sin(t * theta) / sin
    const r = 1 + lift * Math.sin(Math.PI * t)
    out[i * 3] = (a[0] * w1 + b[0] * w2) * r
    out[i * 3 + 1] = (a[1] * w1 + b[1] * w2) * r
    out[i * 3 + 2] = (a[2] * w1 + b[2] * w2) * r
  }
  return out
}

function buildScene(pins, me) {
  const home = toVec(HOME.lat, HOME.lng)
  const items = pins.slice(0, MAX_PINS).map((p, i) => {
    const v = toVec(p.lat, p.lng)
    return { ...p, kind: 'visitor', v, arc: makeArc(v, home), phase: (i * 0.137) % 1 }
  })
  if (me) {
    const v = toVec(me.lat, me.lng)
    items.push({ ...me, count: 0, kind: 'me', v, arc: makeArc(v, home), phase: 0.3 })
  }
  return { home, items }
}

/* ---------------------------------------------------------------- */
/* The component                                                     */
/* ---------------------------------------------------------------- */

export default function LoungeGlobe() {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const sceneRef = useRef(buildScene([], null))
  const { pins, me } = useVisitorPins()

  useEffect(() => {
    sceneRef.current = buildScene(pins, me)
  }, [pins, me])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    const ctx = canvas.getContext('2d')
    const dots = getLandDots()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let w = 0
    let h = 0
    let dpr = 1
    let lng0 = HOME.lng * DEG // longitude at the center of the view
    let lat0 = 0.3 // latitude at the center of the view
    let zoom = 0.85
    let targetZoom = 1
    let vLng = 0
    let vLat = 0
    let dragging = false
    let lastX = 0
    let lastY = 0
    let lastT = 0
    let idleSince = -1e9
    let focus = null
    let pointer = null
    let cursor = 'grab'
    let raf = 0
    let last = -1 // set on the first frame, so dt can never be negative

    // Scratch space reused every frame
    const AX = new Float32Array(64)
    const AY = new Float32Array(64)
    const AV = new Uint8Array(64)
    const P = [0, 0, 0, 0, 0]

    const resize = () => {
      w = wrap.clientWidth
      h = wrap.clientHeight
      dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()

    /* ---------- input: drag, zoom, double-click ---------- */
    const baseRadius = () => Math.min(w, h) * 0.4

    const onDown = (e) => {
      dragging = true
      focus = null
      vLng = 0
      vLat = 0
      lastX = e.clientX
      lastY = e.clientY
      lastT = e.timeStamp
      canvas.setPointerCapture(e.pointerId)
    }

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      if (!dragging) return

      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      const dt = Math.max(1, e.timeStamp - lastT) / 1000
      const k = 1 / (Math.max(1, baseRadius()) * zoom) // radians per pixel, so the surface follows the cursor
      lng0 -= dx * k
      lat0 = clamp(lat0 + dy * k, -LAT_LIMIT, LAT_LIMIT)
      vLng = clamp(vLng * 0.6 + ((-dx * k) / dt) * 0.4, -6, 6)
      vLat = clamp(vLat * 0.6 + ((dy * k) / dt) * 0.4, -6, 6)
      lastX = e.clientX
      lastY = e.clientY
      lastT = e.timeStamp
    }

    const onUp = (e) => {
      if (!dragging) return
      dragging = false
      idleSince = performance.now()
      // If the pointer rested before letting go, don't fling the globe
      if (performance.now() - lastT > 80) {
        vLng = 0
        vLat = 0
      }
      if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
    }

    const onLeave = () => {
      pointer = null
    }

    const onWheel = (e) => {
      e.preventDefault()
      targetZoom = clamp(targetZoom * Math.exp(-e.deltaY * 0.0015), MIN_ZOOM, MAX_ZOOM)
      idleSince = performance.now()
    }

    const onDouble = () => {
      focus = { lat: HOME.lat * DEG, lng: HOME.lng * DEG }
      targetZoom = 1.6
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('dblclick', onDouble)

    /* ---------- drawing ---------- */
    const frame = (now) => {
      // dt can never be negative (rAF timestamps may be earlier than performance.now())
      if (last < 0) last = now
      const dt = clamp((now - last) / 1000, 0, 0.05)
      last = now

      // nothing to draw until the container has a size
      if (w <= 0 || h <= 0) {
        raf = requestAnimationFrame(frame)
        return
      }

      // zoom is always kept in a safe range, so the radius is never negative
      zoom += (targetZoom - zoom) * (1 - Math.exp(-8 * dt))
      zoom = clamp(zoom, MIN_ZOOM * 0.5, MAX_ZOOM)
      const S = Math.max(1, baseRadius() * zoom)

      // Movement: inertia after a drag, slow auto-spin when idle, glide to "home" on double-click
      if (!dragging) {
        if (focus) {
          const k = 1 - Math.exp(-5 * dt)
          lng0 += wrapPi(focus.lng - lng0) * k
          lat0 += (focus.lat - lat0) * k
          vLng = 0
          vLat = 0
          idleSince = now
          if (Math.abs(wrapPi(focus.lng - lng0)) < 0.002 && Math.abs(focus.lat - lat0) < 0.002) focus = null
        } else {
          lng0 += vLng * dt
          lat0 = clamp(lat0 + vLat * dt, -LAT_LIMIT, LAT_LIMIT)
          const decay = Math.exp(-2.8 * dt)
          vLng *= decay
          vLat *= decay
          if (!reduce) {
            const auto = clamp((now - idleSince - 1200) / 1500, 0, 1)
            lng0 -= AUTO_SPEED * auto * dt
          }
        }
      }
      lng0 = wrapPi(lng0)

      const cl = Math.cos(lng0)
      const sl = Math.sin(lng0)
      const cp = Math.cos(lat0)
      const sp = Math.sin(lat0)
      const cx = w / 2
      const cy = h / 2

      // Rotates a unit-sphere point into view. P = [screenX, screenY, depth, x, y]
      const project = (x, y, z) => {
        const x1 = x * cl - z * sl
        const z1 = x * sl + z * cl
        const y2 = y * cp - z1 * sp
        const z2 = y * sp + z1 * cp
        P[0] = cx + x1 * S
        P[1] = cy - y2 * S
        P[2] = z2
        P[3] = x1
        P[4] = y2
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // soft white halo (the glow around the globe)
      const halo = ctx.createRadialGradient(cx, cy, S * 0.97, cx, cy, S * HALO_SIZE)
      halo.addColorStop(0, `rgba(255,255,255,${HALO_ALPHA})`)
      halo.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(cx, cy, S * HALO_SIZE, 0, TAU)
      ctx.fill()

      // the sphere (the ocean)
      const body = ctx.createRadialGradient(cx - S * 0.35, cy - S * 0.4, S * 0.05, cx, cy, S)
      body.addColorStop(0, OCEAN_LIGHT)
      body.addColorStop(1, OCEAN_DARK)
      ctx.fillStyle = body
      ctx.beginPath()
      ctx.arc(cx, cy, S, 0, TAU)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.14)'
      ctx.lineWidth = 1
      ctx.stroke()

      // land dots, brighter toward the middle of the view, grouped by brightness for speed
      const size = clamp(S * 0.0062, 1.15, 3.6)
      const round = size > 2.3
      const paths = Array.from({ length: LEVELS }, () => new Path2D())
      const { xs, ys, zs, n } = dots
      for (let i = 0; i < n; i++) {
        const x = xs[i]
        const y = ys[i]
        const z = zs[i]
        const z1 = x * sl + z * cl
        const z2 = y * sp + z1 * cp
        if (z2 <= 0.02) continue
        const sx = cx + (x * cl - z * sl) * S
        const sy = cy - (y * cp - z1 * sp) * S
        if (sx < -6 || sx > w + 6 || sy < -6 || sy > h + 6) continue
        const lv = Math.min(LEVELS - 1, (Math.pow(z2, 0.8) * LEVELS) | 0)
        if (round) {
          paths[lv].moveTo(sx + size / 2, sy)
          paths[lv].arc(sx, sy, size / 2, 0, TAU)
        } else {
          paths[lv].rect(sx - size / 2, sy - size / 2, size, size)
        }
      }
      for (let l = 0; l < LEVELS; l++) {
        ctx.fillStyle = `rgba(255,255,255,${(0.1 + 0.8 * (l / (LEVELS - 1))).toFixed(3)})`
        ctx.fill(paths[l])
      }

      // arcs from every visitor to home, with a light that travels along each one
      const scene = sceneRef.current
      ctx.lineCap = 'round'
      for (const it of scene.items) {
        const arc = it.arc
        if (!arc) continue
        const N = arc.length / 3 - 1

        for (let i = 0; i <= N; i++) {
          project(arc[i * 3], arc[i * 3 + 1], arc[i * 3 + 2])
          AX[i] = P[0]
          AY[i] = P[1]
          // hidden when behind the globe
          AV[i] = P[2] > 0 || P[3] * P[3] + P[4] * P[4] > 1 ? 1 : 0
        }

        ctx.strokeStyle = it.kind === 'me' ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.2)'
        ctx.lineWidth = 1
        ctx.beginPath()
        let pen = false
        for (let i = 0; i <= N; i++) {
          if (!AV[i]) {
            pen = false
          } else if (pen) {
            ctx.lineTo(AX[i], AY[i])
          } else {
            ctx.moveTo(AX[i], AY[i])
            pen = true
          }
        }
        ctx.stroke()

        if (!reduce) {
          const head = Math.floor(((now / 2600 + it.phase) % 1) * N)
          ctx.lineWidth = 1.8
          for (let k = 0; k < 12; k++) {
            const i1 = head - k
            if (i1 < 1) break
            if (!AV[i1] || !AV[i1 - 1]) continue
            ctx.strokeStyle = `rgba(255,255,255,${(0.95 * (1 - k / 12)).toFixed(2)})`
            ctx.beginPath()
            ctx.moveTo(AX[i1 - 1], AY[i1 - 1])
            ctx.lineTo(AX[i1], AY[i1])
            ctx.stroke()
          }
        }
      }

      // pins
      ctx.font = FONT
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      const label = (text, x, y, color) => {
        ctx.shadowColor = 'rgba(0,0,0,0.9)'
        ctx.shadowBlur = 5
        ctx.fillStyle = color
        ctx.fillText(text, x, y)
        ctx.shadowBlur = 0
      }

      const screenPins = []
      for (const it of scene.items) {
        project(it.v[0] * 1.003, it.v[1] * 1.003, it.v[2] * 1.003)
        if (P[2] < 0.04) continue
        const x = P[0]
        const y = P[1]
        screenPins.push({ x, y, it })

        const isMe = it.kind === 'me'
        ctx.fillStyle = isMe ? '#ffffff' : 'rgba(255,255,255,0.85)'
        ctx.beginPath()
        ctx.arc(x, y, isMe ? 3.2 : 2.4, 0, TAU)
        ctx.fill()

        if (isMe) {
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(x, y, 6.5, 0, TAU)
          ctx.stroke()

          // If you are at (or very near) home, lift the "you" label so it doesn't overlap "Quezon City"
          const nearHome =
            it.v[0] * scene.home[0] + it.v[1] * scene.home[1] + it.v[2] * scene.home[2] > 0.9995
          label('you', x + 11, nearHome ? y - 10 : y + 4, 'rgba(255,255,255,0.95)')
        } else if (zoom > 1.7 && P[2] > 0.3 && it.city) {
          label(it.city, x + 7, y + 4, 'rgba(255,255,255,0.55)')
        }
      }

      // home pin (orange) with a pulse ring
      project(scene.home[0] * 1.003, scene.home[1] * 1.003, scene.home[2] * 1.003)
      if (P[2] > 0.04) {
        const x = P[0]
        const y = P[1]
        const pulse = reduce ? 0.35 : (now % 2000) / 2000
        ctx.strokeStyle = ACCENT
        ctx.globalAlpha = (1 - pulse) * 0.55
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(x, y, 4 + pulse * 16, 0, TAU)
        ctx.stroke()
        ctx.globalAlpha = 1
        ctx.fillStyle = ACCENT
        ctx.beginPath()
        ctx.arc(x, y, 3.8, 0, TAU)
        ctx.fill()
        label(HOME.label, x + 11, y + 4, 'rgba(255,255,255,0.95)')
      }

      // hover: the pin under the cursor shows who and where
      let nearest = null
      let best = 12 * 12
      if (pointer && !dragging) {
        for (const sp2 of screenPins) {
          const dx = sp2.x - pointer.x
          const dy = sp2.y - pointer.y
          const d = dx * dx + dy * dy
          if (d < best) {
            best = d
            nearest = sp2
          }
        }
      }
      const want = dragging ? 'grabbing' : nearest ? 'pointer' : 'grab'
      if (want !== cursor) {
        cursor = want
        canvas.style.cursor = want
      }
      if (nearest) {
        const it = nearest.it
        const place = [it.city || 'somewhere', it.country].filter(Boolean).join(', ')
        const text =
          it.kind === 'me' ? `you · ${place}` : it.count > 1 ? `${place} · ${it.count} messages` : place
        const tw = ctx.measureText(text).width + 16
        const tx = clamp(nearest.x - tw / 2, 4, w - tw - 4)
        const ty = nearest.y - 34
        ctx.fillStyle = 'rgba(26,26,26,0.92)'
        ctx.strokeStyle = 'rgba(255,255,255,0.14)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(tx, ty, tw, 22, 8)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.92)'
        ctx.fillText(text, tx + 8, ty + 15)
      }

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('dblclick', onDouble)
    }
  }, [])

  const fade = 'radial-gradient(closest-side, #000 78%, transparent 100%)'

  return (
    <div
      ref={wrapRef}
      data-keep
      className="relative mx-auto aspect-square select-none"
      style={{
        width: 'min(100%, calc(100dvh - 8rem), 40rem)',
        maskImage: fade,
        WebkitMaskImage: fade,
      }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Globe showing where visitors are chatting from. Drag to rotate, scroll to zoom."
        className="absolute inset-0 size-full cursor-grab touch-none"
      />
      <p className="pointer-events-none absolute inset-x-0 bottom-[12%] text-center text-[0.7rem] text-white/30">
        drag to rotate · scroll to zoom · double-click to find home
      </p>
    </div>
  )
}