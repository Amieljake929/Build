// Xaña's natural voice: asks Azure Speech to read a message and sends back an mp3.
// Needs two environment variables on Vercel: AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.

const VOICES = {
  tl: { lang: 'fil-PH', name: 'fil-PH-BlessicaNeural' }, // native Filipino voice
  en: { lang: 'en-US', name: 'en-US-JennyNeural' }, // clear, friendly English voice
  // Optional: a calm Irish-accented English voice instead. Swap the `en` line above for this one:
  // en: { lang: 'en-IE', name: 'en-IE-EmilyNeural' },
}

// Simple limit so nobody can burn through the free quota: 25 requests / 5 minutes per visitor
const hits = new Map()
function limited(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < 5 * 60 * 1000)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 500) hits.clear()
  return recent.length > 25
}

const escapeXml = (s) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method not allowed' })
  }

  const key = process.env.AZURE_SPEECH_KEY
  const region = process.env.AZURE_SPEECH_REGION
  // Not set up yet: answer normally (not with an error) so the visitor's console stays clean.
  // The site sees this isn't audio and quietly uses the browser voice instead.
  if (!key || !region) return res.status(200).json({ configured: false })

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  if (limited(ip)) return res.status(429).json({ error: 'slow down' })

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }

  const text = String(body?.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 300)
  if (!text) return res.status(400).json({ error: 'no text' })
  const voice = VOICES[body?.lang] || VOICES.en

  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${voice.lang}">` +
    `<voice xml:lang="${voice.lang}" name="${voice.name}">${escapeXml(text)}</voice></speak>`

  try {
    const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'portfolio-xana',
      },
      body: ssml,
    })
    if (!r.ok) return res.status(502).json({ error: 'voice service error' })

    const audio = Buffer.from(await r.arrayBuffer())
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(audio)
  } catch {
    return res.status(502).json({ error: 'voice service unreachable' })
  }
}