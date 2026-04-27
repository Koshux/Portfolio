/**
 * Returns a short English relative-time phrase for the supplied ISO timestamp.
 *
 * Examples: "just now", "5 minutes ago", "3 days ago", "2 weeks ago",
 * "6 months ago", "1 year ago".
 *
 * - `now` is injectable (defaults to `Date.now()`) so callers can produce
 *   stable output during tests and SSR.
 * - Uses `Intl.RelativeTimeFormat('en')` for the heavy lifting.
 * - Future timestamps fall back to "just now" (the chip never claims a
 *   commit happened in the future).
 */
export function relativeTime(iso: string, now: Date | number = Date.now()): string {
  const target = Date.parse(iso)
  if (Number.isNaN(target)) return 'just now'

  const nowMs = typeof now === 'number' ? now : now.getTime()
  const diffMs = nowMs - target

  if (diffMs < 45_000) return 'just now'

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'always', style: 'long' })

  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day
  const year = 365 * day

  const seconds = Math.round(diffMs / 1000)

  if (seconds < 60 * 60) {
    const minutes = Math.max(1, Math.round(diffMs / minute))
    return rtf.format(-minutes, 'minute')
  }
  if (diffMs < day) {
    const hours = Math.max(1, Math.round(diffMs / hour))
    return rtf.format(-hours, 'hour')
  }
  if (diffMs < week) {
    const days = Math.max(1, Math.round(diffMs / day))
    return rtf.format(-days, 'day')
  }
  if (diffMs < month) {
    const weeks = Math.max(1, Math.round(diffMs / week))
    return rtf.format(-weeks, 'week')
  }
  if (diffMs < year) {
    const months = Math.max(1, Math.round(diffMs / month))
    return rtf.format(-months, 'month')
  }
  const years = Math.max(1, Math.round(diffMs / year))
  return rtf.format(-years, 'year')
}
