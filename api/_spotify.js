// Shared helpers for the Spotify endpoints. The leading underscore keeps Vercel
// from turning this file into its own /api route.

const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const API_URL = 'https://api.spotify.com/v1'

let cached = { token: '', expiresAt: 0 }

// Removes accidental spaces, line breaks or quotes around a pasted value
const clean = (v) => (v || '').trim().replace(/^["']|["']$/g, '')

async function getAccessToken() {
  if (cached.token && Date.now() < cached.expiresAt - 60_000) return cached.token

  const id = clean(process.env.SPOTIFY_CLIENT_ID)
  const secret = clean(process.env.SPOTIFY_CLIENT_SECRET)
  const refresh = clean(process.env.SPOTIFY_REFRESH_TOKEN)
  if (!id || !secret || !refresh) throw new Error('Missing Spotify environment variables')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
  })
  if (!res.ok) {
    // Spotify's reason (for example invalid_client or invalid_grant) is safe to log
    const body = await res.json().catch(() => ({}))
    throw new Error(
      `Spotify token request failed (${res.status}): ${body.error || ''} ${body.error_description || ''}`.trim(),
    )
  }

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

// ---- Fallback snapshot (Supabase) ----
// Uses only your PUBLIC key plus two small database functions:
//   get_tunes_snapshot  -> anyone can read the saved copy (it is public data anyway)
//   save_tunes_snapshot -> only works with the TUNES_WRITE_SECRET password
// If anything is missing, the snapshot is simply skipped and nothing breaks.

function supabase() {
  const url = clean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)
  const key = clean(
    process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY,
  )
  if (!url || !key) return null

  const headers = { apikey: key, 'Content-Type': 'application/json' }
  // New sb_publishable_ keys only go in apikey; older anon keys are JWTs and also go in Authorization
  if (!key.startsWith('sb_')) headers.Authorization = `Bearer ${key}`

  return { rpc: `${url}/rest/v1/rpc`, headers }
}

export async function saveSnapshot(id, data) {
  try {
    const sb = supabase()
    const secret = clean(process.env.TUNES_WRITE_SECRET)
    if (!sb || !secret) return
    await fetch(`${sb.rpc}/save_tunes_snapshot`, {
      method: 'POST',
      headers: sb.headers,
      body: JSON.stringify({ p_id: id, p_data: data, p_secret: secret }),
    })
  } catch {
    /* the snapshot is a bonus, never break the page for it */
  }
}

export async function loadSnapshot(id) {
  try {
    const sb = supabase()
    if (!sb) return null
    const res = await fetch(`${sb.rpc}/get_tunes_snapshot`, {
      method: 'POST',
      headers: sb.headers,
      body: JSON.stringify({ p_id: id }),
    })
    if (!res.ok) return null
    const rows = await res.json()
    return rows?.[0] || null
  } catch {
    return null
  }
}