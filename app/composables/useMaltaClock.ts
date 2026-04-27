import type { Ref } from 'vue'
import { onScopeDispose, ref } from 'vue'

const FORMATTER = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Europe/Malta',
  timeZoneName: 'short',
})

/**
 * Returns the current Malta time, formatted as e.g. `"14:32 CEST"`.
 *
 * - On the server: returns the value once. Registers no interval.
 * - On the client: re-renders every 1000 ms. Interval is cleared via
 *   `onScopeDispose` (i.e. when the consuming component unmounts).
 *
 * Live data, not animation — the interval keeps ticking even with
 * `prefers-reduced-motion: reduce`.
 */
export function useMaltaClock(): Ref<string> {
  const now = ref<string>(format(new Date()))

  if (import.meta.client) {
    const id = setInterval(() => {
      now.value = format(new Date())
    }, 1000)
    onScopeDispose(() => clearInterval(id))
  }

  return now
}

function format(date: Date): string {
  // `Intl.DateTimeFormat` outputs e.g. "14:32, CEST" on en-GB. Normalise to
  // "14:32 CEST" by joining the parts directly.
  const parts = FORMATTER.formatToParts(date)
  const hour = parts.find(p => p.type === 'hour')?.value ?? '00'
  const minute = parts.find(p => p.type === 'minute')?.value ?? '00'
  const tz = parts.find(p => p.type === 'timeZoneName')?.value ?? 'CET'
  return `${hour}:${minute} ${tz}`
}
