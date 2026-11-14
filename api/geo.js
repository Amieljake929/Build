// Vercel Function: tells the Lounge the visitor's city and country,
// read from the request headers Vercel adds. Nothing is stored here.
export default function handler(req, res) {
  const rawCity = req.headers['x-vercel-ip-city'] || ''
  let city = rawCity
  try {
    city = decodeURIComponent(rawCity)
  } catch {
    /* keep the raw value */
  }

  res.setHeader('Cache-Control', 'private, max-age=3600')
  res.status(200).json({ city, country: req.headers['x-vercel-ip-country'] || '' })
}