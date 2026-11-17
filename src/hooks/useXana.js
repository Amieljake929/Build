import { useCallback, useEffect, useRef, useState } from 'react'
import {
  detectLang,
  fetchXanaAudio,
  speakWithBrowser,
  speechText,
  stopBrowserSpeech,
} from '../lib/xana'

// Controls Xaña: one message is read at a time, and clicking the same message again stops her
export default function useXana() {
  const [activeId, setActiveId] = useState(null) // the message being read
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'playing'
  const [note, setNote] = useState('')

  const audioRef = useRef(null)
  const tokenRef = useRef(0) // every click gets a new token, so an old request can't start late
  const noteTimer = useRef(0)

  const flash = useCallback((text) => {
    setNote(text)
    clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => setNote(''), 6000)
  }, [])

  const stop = useCallback(() => {
    tokenRef.current += 1
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    stopBrowserSpeech()
    setActiveId(null)
    setStatus('idle')
  }, [])

  // Stop talking when the lounge closes
  useEffect(
    () => () => {
      stop()
      clearTimeout(noteTimer.current)
    },
    [stop],
  )

  const speak = useCallback(
    async (id, raw) => {
      if (activeId === id) {
        stop()
        return
      }
      stop()
      const token = tokenRef.current
      const text = speechText(raw)
      if (!text) return

      const current = () => tokenRef.current === token
      const finish = () => {
        if (!current()) return
        setActiveId(null)
        setStatus('idle')
      }

      setActiveId(id)
      setStatus('loading')
      setNote('')
      const lang = detectLang(text)

      try {
        // 1) natural server voice, when it is set up
        const url = await fetchXanaAudio(text, lang)
        if (!current()) return
        if (url) {
          const audio = new Audio(url)
          audioRef.current = audio
          audio.onended = finish
          audio.onerror = finish
          await audio.play()
          if (current()) setStatus('playing')
          return
        }

        // 2) the visitor's own browser voices
        const result = await speakWithBrowser(text, lang, {
          onStart: () => current() && setStatus('playing'),
          onEnd: finish,
        })
        if (!current()) return
        if (!result.ok) {
          finish()
          flash("this browser can't play voice")
        } else if (result.fallback) {
          flash("Xaña's Tagalog voice isn't on this device, so she's using her English voice")
        }
      } catch {
        finish()
      }
    },
    [activeId, stop, flash],
  )

  return { activeId, status, note, speak, stop }
}