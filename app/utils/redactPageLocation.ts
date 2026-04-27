// app/utils/redactPageLocation.ts
//
// SPEC-002 AC-21 — redact a URL so we can safely send `page_location`
// and `page_referrer` to GA4 without leaking PII or one-time tokens
// from query strings (e.g. magic-link emails, password-reset tokens,
// Salesforce-style `email=foo@bar` params).
//
// Strategy: keep the marketing UTM parameter set (the only query
// params analytics legitimately wants), drop everything else, drop
// the URL fragment entirely.
//
// Pure function — no DOM access, deterministic, easy to unit-test.

const ALLOWED_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
])

export function redactPageLocation(input: string): string {
  if (!input) return input
  let url: URL
  try {
    url = new URL(input)
  }
  catch {
    // Malformed URL: return empty string rather than risk leaking the
    // raw input through to GA4.
    return ''
  }

  // Drop disallowed params. Iterate over a snapshot of keys so the
  // delete loop doesn't mutate the iterator.
  const keys = Array.from(url.searchParams.keys())
  for (const key of keys) {
    if (!ALLOWED_PARAMS.has(key)) {
      url.searchParams.delete(key)
    }
  }

  // Drop the fragment.
  url.hash = ''

  // Avoid `?` if all params were stripped.
  const search = url.searchParams.toString()
  url.search = search ? `?${search}` : ''

  return url.toString()
}
