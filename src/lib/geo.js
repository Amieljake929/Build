// Visitor location: city, country and coordinates.
// 1) /api/geo is a Vercel Function that reads Vercel's location headers (live site).
// 2) That function doesn't exist on localhost, so while developing we fall back to a
//    free IP lookup (ipwho.is). The fallback is removed from the production build.
const EMPTY = { city: '', country: '', lat: null, lng: null }

// Coordinates are rounded to 1 decimal (about 11 km), so pins show roughly the city
const coord = (v, max) => {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) && Math.abs(n) <= max ? Math.round(n * 10) / 10 : null
}

const clean = (city, country, lat, lng) => ({
  city: String(city || '').slice(0, 60),
  country: String(country || '').slice(0, 4),
  lat: coord(lat, 90),
  lng: coord(lng, 180),
})

async function load() {
  try {
    const res = await fetch('/api/geo')
    const type = res.headers.get('content-type') || ''
    // On localhost Vite answers with the web page (HTML), not JSON, so check the type
    if (res.ok && type.includes('application/json')) {
      const g = await res.json()
      if (g.city || g.country) return clean(g.city, g.country, g.lat, g.lng)
    }
  } catch {
    /* not available here, try the dev fallback below */
  }

  if (import.meta.env.DEV) {
    const res = await fetch('https://ipwho.is/')
    const g = await res.json()
    if (g.success !== false) return clean(g.city, g.country_code, g.latitude, g.longitude)
  }

  return EMPTY
}

let promise
export function getGeo() {
  if (!promise) promise = load().catch(() => EMPTY)
  return promise
}