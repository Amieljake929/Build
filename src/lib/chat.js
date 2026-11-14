// "just now", "5m ago", "2h ago", "3d ago", then a date
export function timeAgo(iso, now = Date.now()) {
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

// Basic bad-word filter: masks matches with asterisks. Add or remove words as you like.
const PATTERNS = [
  'fuck\\w*',
  'shit\\w*',
  'bitch\\w*',
  'asshole\\w*',
  'bastard\\w*',
  'pussy',
  'cunt\\w*',
  'whore\\w*',
  'slut\\w*',
  'nigg(?:er|a)s?',
  'fag(?:got)?s?',
  'putang\\s?ina\\w*',
  'tangina\\w*',
  'pakyu',
  'pakshet',
  'tarantado',
  'ulol',
  'gago',
]
const BAD_WORDS = new RegExp(`\\b(?:${PATTERNS.join('|')})\\b`, 'gi')

export const maskBadWords = (text) => text.replace(BAD_WORDS, (m) => '*'.repeat(m.length))