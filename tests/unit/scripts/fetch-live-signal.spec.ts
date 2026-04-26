// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock node:fs/promises before importing the script under test.
const writes: Array<{ path: string; data: string }> = []
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(async (path: string, data: string) => {
    writes.push({ path, data })
  }),
}))

const ENDPOINT_RX = /api\.github\.com\/users\/koshux\/events\/public/

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  })
}

function makePushEvent(overrides: Record<string, unknown> = {}) {
  return {
    type: 'PushEvent',
    repo: { name: 'jameslanzon/Portfolio' },
    created_at: '2026-04-26T11:00:00Z',
    payload: {
      commits: [
        { sha: 'abcdef1234567890abcdef1234567890abcdef12', message: 'msg' },
      ],
    },
    ...overrides,
  }
}

async function importFresh() {
  vi.resetModules()
  // Import fresh so the module's top-level code is re-evaluated against
  // the current mocks.
  return await import('../../../scripts/fetch-live-signal.mjs')
}

const ORIGINAL_FETCH = globalThis.fetch
const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  writes.length = 0
  process.env = { ...ORIGINAL_ENV }
  delete process.env.SKIP_LIVE_SIGNAL_FETCH
  delete process.env.GITHUB_TOKEN
})

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH
  vi.restoreAllMocks()
})

describe('scripts/fetch-live-signal.mjs', () => {
  it('writes the success-shape JSON for a representative payload', async () => {
    globalThis.fetch = vi.fn(async (url: string) => {
      expect(url).toMatch(ENDPOINT_RX)
      return jsonResponse([makePushEvent()])
    }) as unknown as typeof fetch

    const mod = await importFresh()
    const code = await mod.run()
    expect(code).toBe(0)
    expect(writes).toHaveLength(1)
    const written = JSON.parse(writes[0].data)
    expect(written.repo).toBe('jameslanzon/Portfolio')
    expect(written.sha).toBe('abcdef1')
    expect(written.timestamp).toBe('2026-04-26T11:00:00Z')
    expect(typeof written.fetchedAt).toBe('string')
    expect(written.unavailable).toBeUndefined()
  })

  it('writes the unavailable fallback on HTTP 403 + X-RateLimit-Remaining: 0', async () => {
    globalThis.fetch = vi.fn(async () => new Response('rate limited', {
      status: 403,
      headers: { 'X-RateLimit-Remaining': '0' },
    })) as unknown as typeof fetch

    const mod = await importFresh()
    await mod.run()
    const written = JSON.parse(writes[0].data)
    expect(written.unavailable).toBe(true)
    expect(typeof written.fetchedAt).toBe('string')
  })

  it('writes the unavailable fallback on a network error (rejected promise)', async () => {
    globalThis.fetch = vi.fn(async () => { throw new Error('ENOTFOUND') }) as unknown as typeof fetch

    const mod = await importFresh()
    await mod.run()
    expect(JSON.parse(writes[0].data).unavailable).toBe(true)
  })

  it('writes the unavailable fallback when JSON is malformed', async () => {
    globalThis.fetch = vi.fn(async () => new Response('not json', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as unknown as typeof fetch

    const mod = await importFresh()
    await mod.run()
    expect(JSON.parse(writes[0].data).unavailable).toBe(true)
  })

  it('writes the unavailable fallback when the page contains no PushEvent', async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse([
      { type: 'WatchEvent', repo: { name: 'r' }, created_at: '2026-01-01T00:00:00Z', payload: {} },
    ])) as unknown as typeof fetch

    const mod = await importFresh()
    await mod.run()
    expect(JSON.parse(writes[0].data).unavailable).toBe(true)
  })

  it('exits 0 immediately and does NOT read or write when SKIP_LIVE_SIGNAL_FETCH=1', async () => {
    process.env.SKIP_LIVE_SIGNAL_FETCH = '1'
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as unknown as typeof fetch

    const mod = await importFresh()
    const code = await mod.run()
    expect(code).toBe(0)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(writes).toHaveLength(0)
  })

  it('sends an Authorization header when GITHUB_TOKEN is set', async () => {
    process.env.GITHUB_TOKEN = 'ghp_test'
    const fetchSpy = vi.fn(async () => jsonResponse([makePushEvent()]))
    globalThis.fetch = fetchSpy as unknown as typeof fetch

    const mod = await importFresh()
    await mod.run()
    expect(fetchSpy).toHaveBeenCalledOnce()
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer ghp_test')
  })
})
