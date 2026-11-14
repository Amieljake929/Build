import { avatarUri } from '../lib/avatar'

// Stacked avatars + "N people viewing now" with a pulsing live dot
export default function PresenceBadge({ count, seeds }) {
  if (!count) return null

  return (
    <div className="flex flex-col items-start gap-2.5" aria-live="polite">
      <div className="flex -space-x-2">
        {seeds.map((seed) => (
          <img
            key={seed}
            src={avatarUri(seed)}
            alt=""
            className="size-6 rounded-full bg-white ring-2 ring-bg"
          />
        ))}
      </div>

      <p className="flex items-center gap-2 text-xs tracking-[0.02em] text-muted">
        <span className="relative flex size-2" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
        </span>
        <span>
          <strong className="font-semibold text-fg">{count}</strong>{' '}
          {count === 1 ? 'person' : 'people'} viewing now
        </span>
      </p>
    </div>
  )
}