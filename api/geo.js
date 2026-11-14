// Vercel Function: tells the Lounge the visitor's city, country and coordinates,
// read from the request headers Vercel adds. Nothing is stored here.
export default function handler(req, res) {
  const h = req.headers

  let city = h['x-vercel-ip-city'] || ''
  try {
    city = decodeURIComponent(city)
  } catch {
    /* keep the raw value */
  }

  res.setHeader('Cache-Control', 'private, max-age=3600')
  res.status(200).json({
    city,
    country: h['x-vercel-ip-country'] || '',
    lat: h['x-vercel-ip-latitude'] || '',
    lng: h['x-vercel-ip-longitude'] || '',
  })
}