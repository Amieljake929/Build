const CID_KEY = 'lounge:cid'
const NAME_KEY = 'lounge:name'

// The owner (you). These names can only be used while logged in as the owner.
export const OWNER_NAME = 'Amiel'
export const OWNER_COMMAND = '/owner' // type this in the name box to get the owner login
const RESERVED = new Set(['amiel', 'amieljake', 'amieljakebaril', 'amielbaril'])

// Letters (including accented Latin letters) separated by single spaces. No numbers, emoji or symbols.
const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?: [A-Za-zÀ-ÖØ-öø-ÿ]+)*$/

export const isNameFormatOk = (name) => NAME_RE.test(String(name ?? ''))

// Ignores case, accents and spaces: "AMÍEL  jake" -> "amieljake"
const squish = (name) =>
  String(name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()

export const isReservedName = (name) => RESERVED.has(squish(name))

// A random id for this browser (used for "people viewing now")
export function getClientId() {
  try {
    let id = localStorage.getItem(CID_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(CID_KEY, id)
    }
    return id
  } catch {
    return 'guest-' + Math.random().toString(36).slice(2, 10)
  }
}

export function cleanName(raw) {
  return String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, 20)
}

// A saved name that breaks the rules (symbols, emoji...) is dropped, so the visitor has to pick a new one
export function getStoredName() {
  try {
    const name = cleanName(localStorage.getItem(NAME_KEY))
    return isNameFormatOk(name) ? name : ''
  } catch {
    return ''
  }
}

export function setStoredName(name) {
  try {
    localStorage.setItem(NAME_KEY, cleanName(name))
  } catch {
    /* storage unavailable: the name just won't be remembered */
  }
  window.dispatchEvent(new Event('lounge:name'))
}

export function getDevice() {
  const touch = window.matchMedia('(pointer: coarse)').matches
  return touch || window.innerWidth < 768 ? 'mobile' : 'desktop'
}