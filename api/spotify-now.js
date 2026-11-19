import { loadSnapshot, saveSnapshot, shapeTrack, spotifyGet } from './_spotify.js'

// Save the fallback copy at most once every 5 minutes per server instance
let lastSave = 0

export default async function handler(req, res) {
  try {
    let track = null
    let isPlaying = false

    const current = await spotifyGet('/me/player/currently-playing')
    if (current?.item?.type === 'track') {
      track = shapeTrack(current.item)
      isPlaying = Boolean(current.is_playing)
    } else {
      // Nothing playing (or a podcast): show the last played track
      const recent = await spotifyGet('/me/player/recently-played?limit=1')
      const last = recent?.items?.[0]?.track
      if (last) track = shapeTrack(last)
    }

    if (track && Date.now() - lastSave > 5 * 60_000) {
      lastSave = Date.now()
      await saveSnapshot('now', { track, isPlaying: false })
    }

    // Short cache so many visitors cost only one Spotify call every few seconds
    res.setHeader('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=10')
    return res.status(200).json({ track, isPlaying, stale: false })
  } catch (err) {
    console.error('spotify-now failed:', err.message)

    const snap = await loadSnapshot('now')
    res.setHeader('Cache-Control', 'public, s-maxage=30')
    if (snap?.data?.track) {
      return res.status(200).json({ track: snap.data.track, isPlaying: false, stale: true })
    }
    return res.status(200).json({ track: null, isPlaying: false, unavailable: true })
  }
}