import { useEffect, useRef } from 'react'

const TAU = Math.PI * 2

// Twinkling stars and an occasional shooting star, drawn over the blurred backdrop
export default function LoungeStars() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let w = 0
    let h = 0
    let dpr = 1
    let stars = []
    let shooting = null
    let nextShot = performance.now() + 3000
    let raf = 0
    let last = performance.now()

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      const count = Math.round(Math.min(260, (w * h) / 8000))
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.3 + Math.random() * 1.0,
        base: 0.25 + Math.random() * 0.5,
        speed: 0.6 + Math.random() * 1.6,
        phase: Math.random() * TAU,
        drift: 1 + Math.random() * 3,
      }))
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      for (const s of stars) {
        if (!reduce) {
          s.x += s.drift * dt * 0.4
          if (s.x > w + 2) s.x = -2
        }
        const a = reduce ? s.base : s.base * (0.55 + 0.45 * Math.sin((now / 1000) * s.speed + s.phase))
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, TAU)
        ctx.fill()
      }

      if (!reduce) {
        if (!shooting && now > nextShot) {
          shooting = {
            x: w * (0.35 + Math.random() * 0.65),
            y: Math.random() * h * 0.4,
            vx: -(380 + Math.random() * 200),
            vy: 160 + Math.random() * 100,
            life: 0,
          }
          nextShot = now + 7000 + Math.random() * 8000
        }
        if (shooting) {
          shooting.life += dt
          shooting.x += shooting.vx * dt
          shooting.y += shooting.vy * dt
          const alpha = Math.max(0, 1 - shooting.life / 0.9)
          const mag = Math.hypot(shooting.vx, shooting.vy)
          const tx = shooting.x - (shooting.vx / mag) * 90
          const ty = shooting.y - (shooting.vy / mag) * 90
          const g = ctx.createLinearGradient(shooting.x, shooting.y, tx, ty)
          g.addColorStop(0, `rgba(255,255,255,${(0.8 * alpha).toFixed(3)})`)
          g.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.strokeStyle = g
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.moveTo(shooting.x, shooting.y)
          ctx.lineTo(tx, ty)
          ctx.stroke()
          if (shooting.life > 0.9) shooting = null
        }
      }

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />
}