const CID_KEY = 'lounge:cid'
const NAME_KEY = 'lounge:name'

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

export function getStoredName() {
  try {
    return cleanName(localStorage.getItem(NAME_KEY))
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