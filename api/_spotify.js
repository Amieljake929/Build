// Shared helpers for the Spotify endpoints. The leading underscore keeps Vercel
// from turning this file into its own /api route.

const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const API_URL = 'https://api.spotify.com/v1'

let cached = { token: '', expiresAt: 0 }

async function getAccessToken() {
  if (cached.token && Date.now() < cached.expiresAt - 60_000) return cached.token

  const id = process.env.SPOTIFY_CLIENT_ID
  const secret = process.env.SPOTIFY_CLIENT_SECRET
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN
  if (!id || !secret || !refresh) throw new Error('Missing Spotify environment variables')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
  })
  if (!res.ok) throw new Error(`Spotify token request failed (${res.status})`)

  const data = await res.json()
  cached = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return cached.token
}

// Returns parsed JSON, or null when Spotify answers 204 (nothing playing)
export async function spotifyGet(path) {
  const token = await getAccessToken()
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 204) return null
  if (res.status === 401) cached = { token: '', expiresAt: 0 }
  if (!res.ok) throw new Error(`Spotify ${res.status} on ${path.split('?')[0]}`)
  return res.json()
}

// Picks the smallest image that is at least `target` px wide (or the biggest one)
export function pickImage(images, target = 300) {
  if (!images?.length) return ''
  const sorted = [...images].sort((a, b) => (a.width || 0) - (b.width || 0))
  return (sorted.find((i) => (i.width || 0) >= target) || sorted[sorted.length - 1]).url
}

export function shapeTrack(t) {
  return {
    id: t.id,
    name: t.name,
    uri: t.uri,
    url: t.external_urls?.spotify || '',
    artists: (t.artists || []).map((a) => ({
      name: a.name,
      url: a.external_urls?.spotify || '',
    })),
    image: pickImage(t.album?.images, 160),
  }
}

// ---- Fallback snapshot (Supabase). Optional: skipped if the keys are missing ----

function supabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return {
    base: `${url}/rest/v1/tunes_snapshot`,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  }
}

export async function saveSnapshot(id, data) {
  const sb = supabase()
  if (!sb) return
  try {
    await fetch(sb.base, {
      method: 'POST',
      headers: { ...sb.headers, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
    })
  } catch {
    /* the snapshot is a bonus, never break the page for it */
  }
}

export async function loadSnapshot(id) {
  const sb = supabase()
  if (!sb) return null
  try {
    const res = await fetch(`${sb.base}?id=eq.${id}&select=data,updated_at`, {
      headers: sb.headers,
    })
    if (!res.ok) return null
    const rows = await res.json()
    return rows[0] || null
  } catch {
    return null
  }
}