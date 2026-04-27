// tests/e2e/https-health.spec.ts
//
// SPEC-003 AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-13.
//
// This is the production smoke test. It runs against the LIVE origin
// (https://jameslanzon.com and https://www.jameslanzon.com) and asserts
// the HTTPS contract end-to-end: 200 on apex, redirect chain from each
// http/www variant, HSTS header presence, Let's Encrypt issuer, cert
// validity window.
//
// Wired into the `production-smoke` Playwright project (see
// `playwright.config.ts`) so it is excluded from the default
// `npm run test:e2e` run. Invoke with:
//
//   PLAYWRIGHT_PROJECT=production-smoke npm run test:e2e:prod
//
// or via the `nightly-https-health` workflow.
//
// ──────────────────────────────────────────────────────────────────────
// Why we don't use Playwright's `response.securityDetails()` alone:
// it returns issuer/subject/protocol/validFrom/validTo but NOT the
// subjectAltName list. SPEC-003 AC-1/AC-3 specifically require SAN
// coverage of `jameslanzon.com` and `www.jameslanzon.com`, so we use a
// raw `tls.connect` to capture the full peer certificate.
// ──────────────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test'
import { connect as tlsConnect, type PeerCertificate } from 'node:tls'

const APEX = 'jameslanzon.com'
const WWW = `www.${APEX}`
const APEX_HTTPS = `https://${APEX}`
const APEX_HTTPS_ROOT = `${APEX_HTTPS}/`

const ONE_YEAR_SECONDS = 31_536_000
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000

interface CertSummary {
  issuer: string
  subject: string
  subjectAltNames: string[]
  validFrom: Date
  validTo: Date
}

/**
 * Open a TLS socket to `host:443`, capture the peer certificate, and
 * return the bits SPEC-003 cares about. SNI is set explicitly because
 * GitHub Pages serves multiple custom domains from the same anycast IPs
 * and the cert is selected by SNI.
 */
function fetchPeerCertificate(host: string): Promise<CertSummary> {
  return new Promise((resolve, reject) => {
    const socket = tlsConnect(
      {
        host,
        port: 443,
        servername: host,
        rejectUnauthorized: true,
      },
      () => {
        try {
          const cert = socket.getPeerCertificate(true)
          if (!cert || Object.keys(cert).length === 0) {
            reject(new Error(`Empty peer certificate for ${host}`))
            return
          }
          const summary: CertSummary = {
            issuer: stringifyName((cert as PeerCertificate).issuer),
            subject: stringifyName((cert as PeerCertificate).subject),
            subjectAltNames: parseSan((cert as PeerCertificate).subjectaltname),
            validFrom: new Date((cert as PeerCertificate).valid_from),
            validTo: new Date((cert as PeerCertificate).valid_to),
          }
          socket.end()
          resolve(summary)
        } catch (err) {
          reject(err)
        }
      },
    )
    socket.on('error', reject)
    socket.setTimeout(15_000, () => {
      socket.destroy(new Error(`TLS connect timed out: ${host}`))
    })
  })
}

function stringifyName(name: PeerCertificate['issuer'] | undefined): string {
  if (!name) return ''
  return Object.entries(name)
    .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(',') : v}`)
    .join(', ')
}

/** Parse `subjectaltname` strings like `DNS:jameslanzon.com, DNS:www.jameslanzon.com`. */
function parseSan(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.toLowerCase().startsWith('dns:'))
    .map((entry) => entry.slice(4).toLowerCase())
}

/**
 * Issue a single HTTP request without following redirects, and return
 * status + Location. We use the global `fetch` (Node 20+) with
 * `redirect: 'manual'`.
 */
async function headOnce(url: string): Promise<{ status: number; location: string | null; headers: Headers }> {
  const res = await fetch(url, { method: 'GET', redirect: 'manual' })
  // Drain the body so the connection can close cleanly.
  await res.arrayBuffer().catch(() => undefined)
  return {
    status: res.status,
    location: res.headers.get('location'),
    headers: res.headers,
  }
}

test.describe('SPEC-003 — HTTPS health (production)', () => {
  test('AC-1: apex serves 200 over HTTPS', async () => {
    const res = await headOnce(APEX_HTTPS_ROOT)
    expect(res.status, `expected 200 from ${APEX_HTTPS_ROOT}`).toBe(200)
    // GitHub Pages identifies itself in the Server header.
    const server = res.headers.get('server') ?? ''
    expect(server.toLowerCase()).toContain('github')
  })

  test('AC-6: HSTS, IF emitted, is at least 1y and not preloaded (GitHub Pages omits it on custom domains — see ADR-002)', async () => {
    const res = await headOnce(APEX_HTTPS_ROOT)
    const hsts = res.headers.get('strict-transport-security')
    // GitHub Pages does NOT send Strict-Transport-Security on custom
    // domains (only on *.github.io). This is a documented platform
    // limitation captured in ADR-002. We therefore only assert the
    // shape of HSTS *if* the header is present (e.g. if a CDN is
    // introduced in front of Pages in a future iteration).
    test.skip(!hsts, 'HSTS not emitted by GitHub Pages on custom domain — see ADR-002.')
    const value = hsts!.toLowerCase()
    const maxAgeMatch = value.match(/max-age=(\d+)/)
    expect(maxAgeMatch, `max-age directive missing in HSTS header: ${hsts}`).not.toBeNull()
    const maxAge = Number(maxAgeMatch![1])
    expect(maxAge).toBeGreaterThanOrEqual(ONE_YEAR_SECONDS)
    // `preload` is intentionally not enabled in this iteration — see ADR-002.
    expect(value, 'HSTS preload was unexpectedly enabled').not.toContain('preload')
    // `includeSubDomains` is acceptable but not required per AC-6 contingency.
  })

  test('AC-2: http://apex 301/308-redirects to https://apex/ in a single hop', async () => {
    const res = await headOnce(`http://${APEX}`)
    expect([301, 308]).toContain(res.status)
    expect(res.location).not.toBeNull()
    expect(res.location!.replace(/\/$/, '/')).toBe(APEX_HTTPS_ROOT)
  })

  test('AC-3a: https://www redirects to https://apex/', async () => {
    const res = await headOnce(`https://${WWW}/`)
    expect([301, 308]).toContain(res.status)
    expect(res.location).not.toBeNull()
    expect(res.location).toMatch(/^https:\/\/jameslanzon\.com\/?$/)
  })

  test('AC-3b: http://www redirects (eventually) to https://apex/', async () => {
    // Allow a redirect chain here — GitHub Pages typically goes
    // http://www → https://www → https://apex.
    const res = await fetch(`http://${WWW}/`, { redirect: 'follow' })
    await res.arrayBuffer().catch(() => undefined)
    expect(res.url.replace(/\/$/, '/')).toBe(APEX_HTTPS_ROOT)
    expect(res.status).toBe(200)
  })

  test('AC-4: TLS certificate is issued by Let\'s Encrypt and covers the apex (SAN)', async () => {
    const cert = await fetchPeerCertificate(APEX)
    expect(cert.issuer.toLowerCase()).toContain("let's encrypt")
    expect(cert.subjectAltNames).toContain(APEX.toLowerCase())
  })

  test('AC-3c: TLS certificate covers www in SAN', async () => {
    const cert = await fetchPeerCertificate(WWW)
    expect(cert.issuer.toLowerCase()).toContain("let's encrypt")
    expect(cert.subjectAltNames).toContain(WWW.toLowerCase())
  })

  test('AC-5: certificate notAfter is at least 14 days in the future and notAfter - notBefore <= 90 days', async () => {
    const cert = await fetchPeerCertificate(APEX)
    const now = Date.now()
    const remaining = cert.validTo.getTime() - now
    expect(
      remaining,
      `cert validTo (${cert.validTo.toISOString()}) is < 14 days from now — auto-renewal may be stuck`,
    ).toBeGreaterThanOrEqual(FOURTEEN_DAYS_MS)

    const lifetime = cert.validTo.getTime() - cert.validFrom.getTime()
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000
    // Let's Encrypt lifetime is exactly 90 days; allow a small buffer
    // for clock skew between issuer and our local clock.
    expect(lifetime).toBeLessThanOrEqual(ninetyDaysMs + 60_000)
  })
})
