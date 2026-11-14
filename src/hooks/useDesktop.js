import { useEffect, useState } from 'react'

// Wide screen + a mouse/trackpad: the same rule the typing test uses.
const QUERY = '(min-width: 1024px) and (hover: hover) and (pointer: fine)'

export default function useDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const onChange = (e) => setIsDesktop(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}