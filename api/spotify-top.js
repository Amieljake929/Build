import { loadSnapshot, pickImage, saveSnapshot, shapeTrack, spotifyGet } from './_spotify.js'

// How many artists / tracks to show. Change this number if you want more or fewer.
const LIMIT = 5

const RANGE_LABEL = { short_term: 'Last 4 weeks', medium_term: 'Last 6 months' }

// Spotify has no 1-week range, so: last 4 weeks, or last 6 months if that is empty
// (a new account may not have enough history yet).
async function getTop(type) {
  let range = 'short_term'
  let res = await spotifyGet(`/me/top/${type}?time_range=${range}&limit=${LIMIT}`)
  if (!res?.items?.length) {
    range = 'medium_term'
    res = await spotifyGet(`/me/top/${type}?time_range=${range}&limit=${LIMIT}`)
  }
  return { items: res?.items ?? [], label: RANGE_LABEL[range] }
}

export default async function handler(req, res) {
  try {
    const [me, artists, tracks] = await Promise.all([
      spotifyGet('/me'),
      getTop('artists'),
      getTop('tracks'),
    ])

    const data = {
      profile: {
        name: me.display_name || 'Amiel',
        url: me.external_urls?.spotify || '',
        image: pickImage(me.images, 300),
        // Spotify removed some profile fields in 2026, so this may be null
        followers: typeof me.followers?.total === 'number' ? me.followers.total : null,
      },
      artists: {
        label: artists.label,
        items: artists.items.map((a) => ({
          id: a.id,
          name: a.name,
          url: a.external_urls?.spotify || '',
          image: pickImage(a.images, 160),
        })),
      },
      tracks: { label: tracks.label, items: tracks.items.map(shapeTrack) },
    }

    await saveSnapshot('top', data)

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).json({ ...data, stale: false, updatedAt: new Date().toISOString() })
  } catch (err) {
    console.error('spotify-top failed:', err.message)

    // Premium expired, token revoked, Spotify down... serve the last saved copy
    const snap = await loadSnapshot('top')
    res.setHeader('Cache-Control', 'public, s-maxage=60')
    if (snap) {
      return res.status(200).json({ ...snap.data, stale: true, updatedAt: snap.updated_at })
    }
    return res.status(200).json({ unavailable: true })
  }
}