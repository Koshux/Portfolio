// scripts/fetch-live-signal.mjs
//
// Build-time fetch for the header live-signal chip. Resolves James'
// most recent public PushEvent on GitHub and writes the result to
// content/live-signal.json. Always exits 0 — on any failure mode it
// writes the unavailable-fallback object so the build can proceed.
//
// Honours:
//   SKIP_LIVE_SIGNAL_FETCH=1  → exit 0 immediately, no read or write.
//   GITHUB_TOKEN              → adds an Authorization header to lift
//                               the unauthenticated rate limit.
//
// See docs/decisions/ADR-001-live-signal-build-time.md.

import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const OUTPUT_PATH = resolve(process.cwd(), 'content/live-signal.json')
const ENDPOINT = 'https://api.github.com/users/jameslanzon/events/public?per_page=30'
const USER_AGENT = 'jameslanzon.com-portfolio-build'

function log(message) {
  // Single-line stdout so CI logs are debuggable.
  console.log(`[live-signal] ${message}`)
}

async function writeUnavailable(reason) {
  const payload = {
    unavailable: true,
    fetchedAt: new Date().toISOString(),
  }
  await writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  log(`wrote unavailable fallback (${reason})`)
}

async function writeSuccess(repo, sha, timestamp) {
  const payload = {
    repo,
    sha,
    timestamp,
    fetchedAt: new Date().toISOString(),
  }
  await writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  log(`fetched ${repo}@${sha}`)
}

export async function run() {
  if (process.env.SKIP_LIVE_SIGNAL_FETCH === '1') {
    log('skipped (SKIP_LIVE_SIGNAL_FETCH=1)')
    return 0
  }

  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': USER_AGENT,
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  let res
  try {
    res = await fetch(ENDPOINT, { headers })
  }
  catch (err) {
    await writeUnavailable(`network error: ${err?.message ?? 'unknown'}`)
    return 0
  }

  if (!res.ok) {
    const remaining = res.headers.get('x-ratelimit-remaining')
    if (res.status === 403 && remaining === '0') {
      await writeUnavailable('rate limited')
      return 0
    }
    await writeUnavailable(`http ${res.status}`)
    return 0
  }

  let events
  try {
    events = await res.json()
  }
  catch (err) {
    await writeUnavailable(`malformed json: ${err?.message ?? 'unknown'}`)
    return 0
  }

  if (!Array.isArray(events)) {
    await writeUnavailable('unexpected payload shape')
    return 0
  }

  const push = events.find(
    e => e?.type === 'PushEvent'
      && e?.payload?.commits
      && Array.isArray(e.payload.commits)
      && e.payload.commits.length > 0
      && typeof e?.repo?.name === 'string'
      && typeof e?.created_at === 'string',
  )

  if (!push) {
    await writeUnavailable('no PushEvent in page')
    return 0
  }

  const commit = push.payload.commits[push.payload.commits.length - 1]
  if (!commit || typeof commit.sha !== 'string') {
    await writeUnavailable('PushEvent missing commit sha')
    return 0
  }

  await writeSuccess(push.repo.name, commit.sha.slice(0, 7), push.created_at)
  return 0
}

// Allow `node scripts/fetch-live-signal.mjs` to run, while exposing
// `run()` for unit tests. The entrypoint check uses argv only — keeping
// the guard parser-friendly across vitest's transform pipeline.
const argv1 = process.argv[1] || ''
if (argv1.endsWith('fetch-live-signal.mjs')) {
  run()
    .then((code) => { process.exit(code) })
    .catch((err) => {
      log('unexpected: ' + (err && err.message ? err.message : 'unknown'))
      writeUnavailable('unexpected').finally(() => process.exit(0))
    })
}
