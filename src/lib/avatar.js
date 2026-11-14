import { createAvatar } from '@dicebear/core'
import { notionists } from '@dicebear/collection'

const cache = new Map()

// Notionists avatar with a white background, zoomed in on the face.
// Tweak `scale` / `translateY` if the crop doesn't match the playground's "Close Up" preset.
export function avatarUri(seed) {
  const key = String(seed || 'guest')
  if (!cache.has(key)) {
    cache.set(
      key,
      createAvatar(notionists, {
        seed: key,
        backgroundColor: ['ffffff'],
        scale: 150,
        translateY: 10,
      }).toDataUri(),
    )
  }
  return cache.get(key)
}