---
id: ADR-002
title: "HTTPS for jameslanzon.com via GitHub Pages + Let's Encrypt (no GoDaddy SSL, no CDN)"
status: accepted
date: 2026-04-27
deciders: ["James Lanzon"]
supersedes: []
superseded-by: []
---

# ADR-002 — HTTPS via GitHub Pages + Let's Encrypt

## Context

`jameslanzon.com` is registered at **GoDaddy** and served from **GitHub
Pages** as the static output of `nuxt generate` (see
[ADR-001](ADR-001-live-signal-build-time.md) for the rendering model
and [JNY-003](../journeys/JNY-003-https-custom-domain.md) for the
recruiter-facing rationale). At the time of writing, the apex resolves
on plain HTTP only — a "Not secure" badge in every modern browser,
which destroys the iteration-1 credibility goal in a single screen.

Constraints:

- **No backend.** Iteration 1 is static-only. Anything that requires
  origin-side TLS termination on our infrastructure is out.
- **No CDN in front of GitHub Pages.** A proxying CDN (Cloudflare,
  Fastly) would solve TLS but introduces a second vendor, an HTTP-only
  origin leg, an anycast IP set we don't control, and an analytics
  layer we have no consent contract for. JNY-003 §Out of scope is
  explicit.
- **No paid SSL product from GoDaddy.** GoDaddy upsells "Web Security"
  / "SSL" SKUs that are unrelated to GitHub Pages and would cost
  money to install something GitHub Pages provides for free.
- **No key material in the repository or in CI.** Secret-rotation
  burden is unacceptable for a single-engineer portfolio.
- **Must work with JS disabled** (per JNY-001 success criteria) — TLS
  is independent of JS, but any solution involving "JS-driven
  redirect to HTTPS" is rejected on principle.

## Decision

Use **GitHub Pages' built-in Let's Encrypt integration**, configured
via:

1. **GoDaddy as DNS-only.** Default GoDaddy nameservers
   (`ns*.domaincontrol.com`) remain authoritative. Apex `A` and `AAAA`
   records point to GitHub Pages' published anycast IPs; `www` is a
   `CNAME` to `<user>.github.io.`; a
   `_github-pages-challenge-jameslanzon` `TXT` record verifies the
   user-level domain.
2. **GitHub Pages "Enforce HTTPS"** turned on once Let's Encrypt has
   issued a SAN cert covering `jameslanzon.com` and
   `www.jameslanzon.com`. GitHub renews the cert automatically at ~60
   days into its 90-day lifetime.
3. **Apex (`jameslanzon.com`) is canonical.** `www` 301/308-redirects
   to apex; `http://*` 301/308-redirects to `https://jameslanzon.com/`.
   Both redirects are handled by GitHub Pages — no per-route rule
   from us.
4. **HSTS is best-effort, not contractual.** GitHub Pages **does not
   emit `Strict-Transport-Security` on custom domains** (only on
   `*.github.io`); confirmed live on 2026-04-27 — see Limitations
   below. The HTTP → HTTPS 301 redirect (handled by GitHub Pages)
   remains the day-zero protection. If a future iteration introduces
   a CDN (superseding this ADR), HSTS will be reintroduced **without**
   `preload` in the first cut — preload is effectively irreversible
   and the value of a 1-year `max-age` already covers >99% of the
   threat model.

The detailed manual steps live in
[docs/runbooks/https-godaddy-github-pages.md](../runbooks/https-godaddy-github-pages.md).
The repository-side guards are listed in
[SPEC-003](../specs/SPEC-003-https-custom-domain.md) §Test plan.

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|---|---|---|---|
| **A. GoDaddy "SSL" / "Web Security" upsell** | One-vendor billing relationship; GoDaddy support owns the cert. | Costs money; GoDaddy SSL products terminate TLS at GoDaddy's hosting (which we don't use) and do **not** apply to GitHub Pages; would require GoDaddy hosting too, which is a much bigger migration. | Architecturally incompatible with GitHub Pages hosting. |
| **B. Cloudflare in front of GitHub Pages (orange-cloud / proxied)** | Free TLS at the edge, edge cache, DDoS protection, easy DNS-level redirects. | Two-vendor setup; HTTP-only origin leg between Cloudflare and GitHub Pages (Cloudflare "Flexible SSL" mode is insecure; "Full" mode requires a cert at the origin which GitHub Pages already provides — circular); Cloudflare auto-injects analytics/cookies which conflict with the SPEC-002 consent contract; iteration-1 contract is "GitHub Pages, nothing in front". | Out-of-scope per JNY-003; conflicts with SPEC-002 consent-gating; adds vendor surface area for marginal value. **Parked** — may revisit if traffic ever justifies edge cache. |
| **C. Cloudflare DNS only (grey-cloud, no proxy)** | Free, fast DNS; supports `CAA` and `CNAME flattening` cleanly. | Migrates DNS off GoDaddy; doubles the number of consoles to keep coherent; offers no incremental TLS benefit because GitHub Pages still issues the cert. | Migration cost without TLS benefit. **Parked** — separate ADR if/when GoDaddy DNS becomes a problem. |
| **D. Self-host the cert** (Caddy / Nginx + Let's Encrypt on a VPS) | Full control of TLS termination, headers, redirects. | Requires a backend, contradicting iteration 1's "no backend" constraint; introduces a 24/7 server to patch and pay for. | Violates JNY-001 / SPEC-001 hard rules. |
| **E. GitHub Pages + Let's Encrypt (chosen).** | Free; zero key material in the repo; GitHub auto-renews; canonicalisation + HSTS built in; works with the existing `public/CNAME`; preserves the static-only contract. | Bound to GitHub's implementation choices (e.g. HSTS header value, redirect codes); a Let's Encrypt rate-limit trip (5/week per registered domain) can grey out "Enforce HTTPS" for a week. | — |

## Consequences

### Positive

- Zero monetary cost for the certificate. The only ongoing cost is
  the GoDaddy domain registration fee.
- No key material in the repository or in CI — eliminates a whole
  class of secret-rotation risk.
- Auto-renewal: GitHub renews at ~60 days into a 90-day cert. The
  nightly smoke test (SPEC-003 AC-13) catches stuck renewal at ≥ 14
  days remaining, giving 30+ days of headlights before any visitor
  sees a warning.
- Canonical-host + HTTPS redirects handled by GitHub Pages — no
  per-route rule code, no Nuxt redirect plugin, nothing to maintain.
- Compatible with the SPEC-002 consent contract: no extra third-party
  TLS terminator means no extra cookies / fingerprints.

### Negative

- **No HSTS on the apex.** GitHub Pages does not emit
  `Strict-Transport-Security` on custom domains (see Limitations).
  Returning visitors who explicitly type `http://jameslanzon.com`
  rely on the 301 redirect each time rather than a browser-cached
  HSTS policy. Acceptable for a static, login-less marketing site;
  would not be acceptable for an authenticated app.
- **HSTS lockout (hypothetical).** If a future iteration adds a CDN
  that emits HSTS, once a browser caches
  `Strict-Transport-Security: max-age=31536000`, downgrading to plain
  HTTP is impossible from that browser for one year. *Planned
  mitigation:* no `preload` in any first cut; rolling back is still
  possible by restoring HTTPS.
- **Let's Encrypt rate limit.** 5 issuances per registered domain per
  week. If a future agent toggles GitHub's custom-domain field
  off/on while troubleshooting DNS, they trip it. *Mitigation:* the
  runbook explicitly forbids toggling, and the failure mode degrades
  to "site reachable on HTTP only for ~7 days" rather than total
  outage.
- **Vendor coupling to GitHub Pages' header behaviour.** GitHub
  controls the redirect codes (301 vs 308) and the cert chain.
  SPEC-003 AC-6 was relaxed to "HSTS optional" once it became clear
  GitHub Pages omits the header on custom domains, so the test suite
  no longer depends on a header GitHub doesn't ship.
- **Bound to a single CN.** Adding `blog.jameslanzon.com` later
  requires re-running the runbook for that subdomain; not a wildcard
  cert.

### Neutral

- IPv6 + IPv4 both required. GitHub publishes four `A` and four
  `AAAA` records; we mirror all eight at GoDaddy.
- The redirect target depends on `public/CNAME`. The existing
  `tests/integration/cname.spec.ts` already locks `public/CNAME` to
  the apex form; SPEC-003 AC-14 extends it to also forbid
  `http://jameslanzon.com` literals in source.

## Security

- **No private keys in the repo or in CI.** Defence-in-depth: SPEC-003
  AC-11 fails the build if any `*.pem`/`*.key`/`*.crt`/`*.csr`/`*.p12`
  file is committed; `.gitignore` covers the same patterns; ACME
  challenge files (`.well-known/acme-challenge/`) are forbidden in
  `public/` (AC-12).
- **Mixed-content guard.** AC-14 fails the build if any source file
  references `http://jameslanzon.com` or `http://www.jameslanzon.com`
  — every internal link must be relative, and any absolute self-link
  must be `https://`.
- **CAA hardening.** The runbook step 1 verifies any existing `CAA`
  record permits `letsencrypt.org`. Step 1 also recommends adding
  `0 issuewild ";"` defensively to forbid wildcard issuance for the
  domain.
- **HSTS.** Not available on GitHub Pages custom domains (see
  Limitations). The 301 redirect from `http://` (AC-2) is the sole
  transport-protection mechanism for this iteration. Preload is out
  of scope until a CDN is introduced and ≥ 3 months of operational
  stability are observed.
- **Visitor data.** No new data is collected by virtue of HTTPS.
  Consent contract from SPEC-002 is unchanged.

## Privacy

Unchanged from SPEC-002. HTTPS is purely a transport-layer concern.

## Limitations

### No HSTS on custom domains

**Observed 2026-04-27** post-"Enforce HTTPS" tick:

```
PS> curl.exe -sI https://jameslanzon.com
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 25204
Server: GitHub.com
Content-Type: text/html; charset=utf-8
Last-Modified: Mon, 27 Apr 2026 21:16:16 GMT
Access-Control-Allow-Origin: *
ETag: "69efd220-6274"
expires: Mon, 27 Apr 2026 21:29:43 GMT
Cache-Control: max-age=600
x-proxy-cache: MISS
X-GitHub-Request-Id: B26C:298A8F:D2DA107:D4AC328:69EFD2EF
Accept-Ranges: bytes
Age: 0
Date: Mon, 27 Apr 2026 21:32:19 GMT
Via: 1.1 varnish
X-Served-By: cache-mrs10565-MRS
X-Cache: HIT
X-Cache-Hits: 0
X-Timer: S1777325540.793097,VS0,VE122
Vary: Accept-Encoding
X-Fastly-Request-ID: 11e003b2f3daa28dd4dc180b5dd9de2c2f7544c3

PS> curl.exe -sI https://jameslanzon.com | Select-String "strict-transport-security"
(no output)
```

22 response headers, **zero** `strict-transport-security`. This is by
GitHub design: HSTS is only emitted on `*.github.io` hosts where
GitHub controls the parent zone and can preload it. On a custom
domain, GitHub deliberately leaves it off so a domain owner who later
wants to migrate off GitHub Pages is not locked out by browser-cached
HSTS for up to a year.

**Implications for SPEC-003:**

- AC-6 is relaxed to "HSTS is optional; if present, must satisfy
  `max-age >= 31536000` and not include `preload`."
- The production smoke `tests/e2e/https-health.spec.ts` AC-6 case is
  guarded with `test.skip(!hsts, …)` so a missing header produces a
  *skip*, not a *fail*. The same test will start asserting the
  contract automatically the day a CDN (or GitHub itself) starts
  emitting HSTS.
- The protection that HSTS would have added is only meaningful for
  authenticated traffic. This site has no auth, no forms, no PII;
  the residual risk reduces to "someone on a hostile network forces
  HTTP on the very first visit" — closed by the 301 redirect on
  every subsequent request from any modern browser that has cached
  the redirect.

If the threat model changes (auth added, forms collecting PII,
high-value third-party embeds), revisit by introducing a CDN — that
becomes a separate ADR superseding this one.

## Follow-ups

- **HSTS preload submission.** Not possible until HSTS itself is
  emitted (see Limitations). Tied to the CDN follow-up below.
- **Cloudflare edge cache + HSTS.** Re-evaluate if traffic patterns
  justify an edge cache, OR if the threat model grows to include
  authenticated traffic. A new ADR would supersede this one.
- **Defensive domains** (`jameslanzon.dev`, `.eu`). Out of scope;
  separate ADR if pursued.
- **Status flip.** Move this ADR from `proposed` to `accepted` once
  the runbook is executed and the production smoke test
  ([tests/e2e/https-health.spec.ts](../../tests/e2e/https-health.spec.ts))
  passes against the live origin.
