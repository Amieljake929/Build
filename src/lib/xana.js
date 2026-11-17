// Xaña: the voice that reads chat messages aloud (English + Tagalog only)
export const XANA_NAME = 'Xaña'

// Common Tagalog words, used to tell Tagalog (and Taglish) messages apart from English
const TAGALOG_WORDS = new Set([
  'ang', 'ng', 'mga', 'sa', 'na', 'ay', 'ako', 'ikaw', 'ka', 'mo', 'ko', 'siya', 'kami', 'kayo',
  'sila', 'tayo', 'namin', 'natin', 'ninyo', 'niyo', 'nila', 'akin', 'iyo', 'kanya', 'atin', 'ito',
  'po', 'opo', 'hindi', 'oo', 'wala', 'pero', 'kasi', 'naman', 'lang', 'din', 'rin', 'pa', 'ba',
  'talaga', 'salamat', 'kumusta', 'mahal', 'gusto', 'ayaw', 'bakit', 'paano', 'saan', 'kailan',
  'ano', 'sino', 'dito', 'doon', 'lahat', 'ngayon', 'mamaya', 'kanina', 'bukas', 'sige', 'tara',
  'halika', 'pwede', 'puwede', 'huwag', 'wag', 'nga', 'daw', 'raw', 'kaya', 'dahil', 'kung',
  'kapag', 'habang', 'sana', 'muna', 'nang', 'magandang', 'umaga', 'gabi', 'hapon', 'tanghali',
  'ingat', 'mabuti', 'pogi', 'ganda', 'bawal', 'pala',
])

// 'tl' (Tagalog) or 'en' (English, also used for any other language)
export function detectLang(text) {
  const words = String(text ?? '').toLowerCase().match(/[a-zñ]+/g) || []
  if (!words.length) return 'en'
  let hits = 0
  for (const w of words) if (TAGALOG_WORDS.has(w)) hits++
  const ratio = hits / words.length
  if (hits >= 2 && ratio >= 0.25) return 'tl'
  if (words.length <= 3 && hits >= 1 && ratio >= 0.33) return 'tl'
  return 'en'
}

// Removes things that sound bad when read aloud (links, emoji, masked words, symbols)
export function speechText(raw) {
  return String(raw ?? '')
    .replace(/https?:\/\/\S+/gi, ' link ')
    .replace(/[*_~`#|]+/g, ' ')
    .replace(/\p{Extended_Pictographic}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300)
}

/* ---------------------------------------------------------------- */
/* Engine 1: natural voice from the server (Azure), if it is set up    */
/* ---------------------------------------------------------------- */

// The local dev server doesn't run the /api folder, so skip the server voice there
// (this also keeps the console clean). To test it locally with `vercel dev`,
// set VITE_XANA_REMOTE=true in .env.local.
let remoteOff = Boolean(import.meta.env.DEV) && import.meta.env.VITE_XANA_REMOTE !== 'true'
const audioCache = new Map() // text -> blob url, so replaying a message costs nothing

export async function fetchXanaAudio(text, lang) {
  if (remoteOff) return null
  const key = `${lang}:${text}`
  if (audioCache.has(key)) return audioCache.get(key)

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
      signal: ctrl.signal,
    })
    if (!res.ok) {
      if ([404, 405, 501, 503].includes(res.status)) remoteOff = true
      return null
    }
    // "not configured" comes back as plain JSON, not audio: stop asking for this visit
    if (!(res.headers.get('content-type') || '').includes('audio')) {
      remoteOff = true
      return null
    }
    const url = URL.createObjectURL(await res.blob())
    audioCache.set(key, url)
    if (audioCache.size > 30) {
      const oldest = audioCache.keys().next().value
      URL.revokeObjectURL(audioCache.get(oldest))
      audioCache.delete(oldest)
    }
    return url
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/* ---------------------------------------------------------------- */
/* Engine 2: the visitor's own browser voices (free, no setup)         */
/* ---------------------------------------------------------------- */

// Browsers don't say which voices are female, so we go by well-known voice names
const FEMALE =
  /aria|jenny|ava|emma|michelle|zira|hazel|susan|libby|sonia|natasha|samantha|karen|moira|tessa|victoria|fiona|serena|kate|catherine|allison|joanna|salli|kendra|kimberly|ivy|rosa|blessica|female|google us english/i
const MALE =
  /david|mark|george|james|guy|ryan|christopher|eric|roger|steffan|daniel|alex|fred|tom|thomas|oliver|angelo|\bmale\b/i

const langOf = (v) => (v.lang || '').replace('_', '-').toLowerCase()

function scoreVoice(v) {
  const name = v.name || ''
  let s = 0
  if (FEMALE.test(name)) s += 10
  if (/natural|neural|online/i.test(name)) s += 6
  const lg = langOf(v)
  if (lg === 'en-us' || lg === 'en-ph') s += 3
  else if (lg === 'en-gb') s += 2
  return s
}

function pickVoice(voices, lang) {
  const pool = voices.filter((v) => {
    if (MALE.test(v.name || '')) return false
    const lg = langOf(v)
    return lang === 'tl' ? lg.startsWith('fil') || lg.startsWith('tl') : lg.startsWith('en')
  })
  if (!pool.length) return null
  return pool.map((v) => [scoreVoice(v), v]).sort((a, b) => b[0] - a[0])[0][1]
}

// Voices load a moment after the page opens in some browsers
function loadVoices() {
  const synth = window.speechSynthesis
  const now = synth.getVoices()
  if (now.length) return Promise.resolve(now)
  return new Promise((resolve) => {
    const done = () => resolve(synth.getVoices())
    synth.addEventListener('voiceschanged', done, { once: true })
    setTimeout(done, 1000)
  })
}

export function stopBrowserSpeech() {
  try {
    window.speechSynthesis?.cancel()
  } catch {
    /* nothing to stop */
  }
}

// Returns { ok, fallback }: fallback means Tagalog was wanted but only an English voice exists
export async function speakWithBrowser(text, lang, { onStart, onEnd }) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return { ok: false }

  const voices = await loadVoices()
  let voice = pickVoice(voices, lang)
  let fallback = false
  if (!voice && lang === 'tl') {
    voice = pickVoice(voices, 'en')
    fallback = true
  }

  const u = new SpeechSynthesisUtterance(text)
  if (voice) {
    u.voice = voice
    u.lang = voice.lang
  } else {
    u.lang = lang === 'tl' ? 'fil-PH' : 'en-US'
  }
  u.rate = lang === 'tl' && !fallback ? 0.92 : 0.97
  u.pitch = 1.1
  u.onstart = onStart
  u.onend = onEnd
  u.onerror = onEnd

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
  return { ok: true, fallback }
}