---
id: SPEC-003
title: "HTTPS for jameslanzon.com via GitHub Pages + Let's Encrypt"
status: draft
created: 2026-04-27
owner: "James Lanzon"
journeys: [JNY-003]
adrs: []
---

# SPEC-003 — HTTPS for `jameslanzon.com` via GitHub Pages + Let's Encrypt

## Summary

Make `https://jameslanzon.com` and `https://www.jameslanzon.com` serve
the iteration-1 site over a valid, automatically-renewing TLS
certificate, with all `http://` requests permanently redirected to
`https://` and all `www.` requests canonicalised to the apex. Achieved
by **GoDaddy DNS-only configuration** (registrar-as-DNS) + GitHub
Pages' built-in **Let's Encrypt** integration. **No GoDaddy SSL
product is purchased**, no CDN is introduced in front of GitHub Pages,
and no key material lives in the repository or in CI. The ongoing
cost is the GoDaddy domain registration fee; the certificate cost is
zero and renewal is automatic. See
[JNY-003](../journeys/JNY-003-https-custom-domain.md) for the
"why" and the ultra-think context that drives the runbook below.

This spec splits cleanly into two halves: a **DNS + GitHub runbook**
(authoritative manual checklist, owned by the site owner) and a
**repository-side guard** (automated tests + workflow assertions) that
prevents future regressions. The runbook is the source of truth for
the one-time configuration; the guards are the source of truth for
"is HTTPS still healthy today?" and run on every deploy.

## Acceptance criteria

The contract. Each is verifiable by a test, a `curl` snippet, or a
console screenshot captured into the implementation log.

- [ ] **AC-1** — `curl -sI https://jameslanzon.com` returns
      **HTTP 200** with a `Server` header from GitHub Pages and a
      response body matching the iteration-1 home page. The TLS
      certificate served on the apex MUST include
      `jameslanzon.com` in its Subject Alternative Names.
- [ ] **AC-2** — `curl -sI http://jameslanzon.com` returns a single
      **301 or 308** redirect with `Location: https://jameslanzon.com/`
      (no redirect chain, no `http → http` hop). Verified by
      `curl -sIL` showing exactly two requests.
- [ ] **AC-3** — `curl -sIL https://www.jameslanzon.com` resolves with
      a valid certificate (Subject Alternative Names include
      `www.jameslanzon.com`) and **301 / 308 redirects to**
      `https://jameslanzon.com/` (apex chosen as canonical host;
      see Open questions in JNY-003 — defaulted here per spec
      decision below). Equivalent for `http://www.jameslanzon.com`.
- [ ] **AC-4** — The TLS certificate served on both hostnames is
      **issued by Let's Encrypt** (issuer common name matches `R3`,
      `E1`, or successor LE intermediate; root chains to ISRG Root X1
      or X2). Verified by
      `openssl s_client -connect jameslanzon.com:443 -servername jameslanzon.com </dev/null | openssl x509 -noout -issuer -subject -ext subjectAltName`.
- [ ] **AC-5** — Certificate `notAfter` is **at most 90 days** ahead
      of `notBefore` (Let's Encrypt's lifetime), and at any point in
      time **`notAfter` is at least 14 days in the future** —
      verified by the smoke test (AC-13). A failure here is the early
      signal that auto-renewal has stopped.
- [ ] **AC-6** — The HTTPS response carries a
      `Strict-Transport-Security` header with `max-age` ≥ `31536000`
      (1 year) **and no `preload` directive** (see Risks). The
      `includeSubDomains` directive is **asserted only if** the
      runbook step T9a (live `curl -sI` against another known
      GitHub-Pages-custom-domain site) confirms GitHub Pages
      currently emits it; otherwise the assertion is downgraded to
      "`includeSubDomains` is acceptable but not required". This
      contingency exists because GitHub Pages' HSTS header has
      historically shipped without `includeSubDomains` and we MUST
      NOT write a test that fails on day one based on a stale
      assumption. T9a captures the observed value into the log;
      AC-6 is finalised in the implementation log, not at spec time.
- [ ] **AC-7** — DNS records at GoDaddy for `jameslanzon.com` are
      **exactly** the set in §Design → DNS records. Apex `A` and
      `AAAA` records point to GitHub Pages' published anycast IPs,
      `www` is a `CNAME` to `jameslanzon.github.io.`, the
      `_github-pages-challenge-jameslanzon` `TXT` record is present
      under the user-level domain, **no** `URL Redirect` /
      `Forwarding` / `Masking` entries exist, and any pre-existing
      `MX` / SPF `TXT` / `_dmarc` / `_domainkey` records are
      preserved verbatim. Verified by:
      1. **Pre-flight `dig`s** captured before any change:
         `dig NS jameslanzon.com +short` (must list GoDaddy
         nameservers — if not, GoDaddy DNS edits are no-ops and the
         runbook stops),
         `dig MX jameslanzon.com +short`,
         `dig TXT jameslanzon.com +short`,
         `dig CAA jameslanzon.com +short` (must be empty **or**
         contain a record permitting `letsencrypt.org`; otherwise
         Let's Encrypt issuance silently fails and the runbook
         stops to add the CAA record).
      2. **Post-change `dig`s** for the same record types asserting
         email/SPF/DMARC/DKIM are byte-equal to the pre-flight
         capture (preservation guarantee).
      3. **Apex/`www` `dig`s**:
         `dig jameslanzon.com A +short`,
         `dig jameslanzon.com AAAA +short`,
         `dig www.jameslanzon.com CNAME +short`.
      4. GoDaddy DNS console screenshot of the full `Records` list
         and the `Forwarding` tab pasted into the implementation
         log.
- [ ] **AC-8** — In **GitHub repo settings → Pages**, the custom
      domain field reads `jameslanzon.com`, the "DNS check
      successful" indicator is green, **"Enforce HTTPS" is ticked
      and not greyed out**. Verified by a screenshot in the log.
- [ ] **AC-9** — The user-level GitHub setting under **Settings →
      Pages → Verified domains** lists `jameslanzon.com` as
      **Verified**. Verified by a screenshot in the log.
- [ ] **AC-10** — The repository file `public/CNAME` contains exactly
      `jameslanzon.com` (with optional trailing newline) and
      `nuxt generate` emits `.output/public/CNAME` byte-equivalent.
      This is already covered by SPEC-001 AC-26 and the existing
      [tests/integration/cname.spec.ts](../../tests/integration/cname.spec.ts)
      — re-asserted here so a regression closes JNY-003 too.
- [ ] **AC-11** — **No** `*.pem`, `*.key`, `*.crt`, `*.csr`, or
      `*.p12` file exists anywhere under the repository (excluding
      `node_modules/`, `.output/`, and `test-results/`). Verified by
      a unit test that walks the working tree and a `.gitignore`
      defence-in-depth entry.
- [ ] **AC-12** — **No** `.well-known/acme-challenge/` directory or
      ACME challenge file exists in `public/` or in the generated
      output. ACME challenges are handled by GitHub Pages out-of-band
      and must not be served by the static site.
- [ ] **AC-13** — A new e2e smoke test
      ([tests/e2e/https-health.spec.ts](../../tests/e2e/https-health.spec.ts))
      runs against the live origin
      `https://jameslanzon.com` (and `https://www.jameslanzon.com`),
      asserting: (a) 200 on apex HTTPS, (b) HSTS header value as in
      AC-6, (c) certificate issuer is Let's Encrypt, (d) certificate
      `notAfter` is ≥ 14 days in the future, (e) `http://` apex and
      both `www` variants 301/308-redirect to `https://jameslanzon.com/`.
      The test runs on the `nightly-https-health` GitHub Actions
      workflow on a `schedule:` cron and on every push to `main`. It
      does **not** block PR merges (the live origin is decoupled from
      PRs).
- [ ] **AC-14** — The `tests/integration/cname.spec.ts` check
      additionally fails if any file under `app/`, `content/`, or
      `public/` (excluding the generated `og:url` known good URL
      `https://jameslanzon.com/`) contains an `http://jameslanzon.com`
      or `http://www.jameslanzon.com` literal. Mixed-content
      defence (see JNY-003 Risks). Runs in CI, blocks merges.
- [ ] **AC-15** — A new **runbook** lives at
      [docs/runbooks/https-godaddy-github-pages.md](../runbooks/https-godaddy-github-pages.md)
      describing every console step, in order, with the exact
      record values and "what to do if X breaks". Authored from
      §Runbook below; must be the implementation deliverable, not
      a duplicate of this spec.

## Non-goals

- Migrating registrar away from GoDaddy. Future ADR.
- Putting Cloudflare or any CDN in front of GitHub Pages. Iteration-1
  contract is "GitHub Pages, nothing in front" — see
  [JNY-003 §Out of scope](../journeys/JNY-003-https-custom-domain.md).
- HSTS preload list submission. Out of scope until 3+ months stable;
  separate ADR.
- Purchasing or installing any SSL product from GoDaddy.
- Email DNS changes (MX / SPF / DKIM / DMARC). The implementer must
  **preserve** existing email records verbatim; changing them is out
  of scope and out of scope means "do not touch".
- Subdomains other than `www.` (e.g. `blog.`, `cv.`).
- Wildcard certificates. Let's Encrypt via GitHub Pages issues
  per-host certs; that is sufficient for `apex` + `www`.
- IPv6-only or IPv4-only operation. Both are required (AC-7).

## Design

### DNS records (the GoDaddy-side contract)

> Exact IP literals in this table are **the values published by
> GitHub at implementation time**. The implementer MUST verify them
> against
> <https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site>
> immediately before applying. Stale IPs in this spec are a worse
> outcome than the small inconvenience of cross-checking.

| Host | Type | Value | TTL | Source / why |
|---|---|---|---|---|
| `@` (apex) | `A` | `185.199.108.153` | 600 | GitHub Pages anycast IPv4 #1 |
| `@` | `A` | `185.199.109.153` | 600 | GitHub Pages anycast IPv4 #2 |
| `@` | `A` | `185.199.110.153` | 600 | GitHub Pages anycast IPv4 #3 |
| `@` | `A` | `185.199.111.153` | 600 | GitHub Pages anycast IPv4 #4 |
| `@` | `AAAA` | `2606:50c0:8000::153` | 600 | GitHub Pages anycast IPv6 #1 |
| `@` | `AAAA` | `2606:50c0:8001::153` | 600 | GitHub Pages anycast IPv6 #2 |
| `@` | `AAAA` | `2606:50c0:8002::153` | 600 | GitHub Pages anycast IPv6 #3 |
| `@` | `AAAA` | `2606:50c0:8003::153` | 600 | GitHub Pages anycast IPv6 #4 |
| `www` | `CNAME` | `jameslanzon.github.io.` | 600 | Repo Pages host |
| `_github-pages-challenge-jameslanzon` | `TXT` | *(value supplied by GitHub user-level Pages settings — paste verbatim)* | 600 | User-level domain verification (AC-9) |
| existing `MX`, SPF `TXT`, `_dmarc`, `_domainkey` | various | **unchanged** | unchanged | Email — must be preserved |

Records that **must not** exist on the apex after the change:

- Any GoDaddy `Forwarding` / `Domain Forwarding` / `URL Redirect`
  entry. (GoDaddy presents these in a separate "Forwarding" tab,
  not under "Records".) **Off.**
- Any `A` or `AAAA` record pointing to GoDaddy parking IPs
  (`50.63.202.*`, `184.168.*.*`, `184.169.*.*`, `Parked.*`).
- Any `CNAME` on `@` (illegal at the apex; remove if present).
- Any stale `_acme-challenge` `TXT` left over from a previous
  manual cert attempt.
- Any `CAA` record that **forbids** `letsencrypt.org`. If a `CAA`
  record exists at all, it MUST include
  `0 issue "letsencrypt.org"` and (defensively)
  `0 issuewild ";"` to forbid wildcard issuance. If no `CAA`
  exists, leave it absent (default is permissive).

### Canonical host

**Apex (`jameslanzon.com`) is canonical.** Rationale: matches the
existing `public/CNAME`, matches every `og:url` and absolute URL in
the iteration-1 spec, and avoids an extra label in the brand. `www`
must redirect to apex. GitHub Pages handles this automatically when
the `CNAME` file holds the apex form and the `www` host is a `CNAME`
to `<user>.github.io.` — no per-redirect rule is required from us.

### HSTS

GitHub Pages emits `Strict-Transport-Security: max-age=31536000`
when "Enforce HTTPS" is on. The `includeSubDomains` directive is
also emitted. We do **not** request the `preload` directive in this
iteration (see Risks: a stuck HSTS preload is a year-long lockout).
A future ADR may opt in once the configuration has been stable for
≥ 3 months.

### Affected areas

| Path | Change |
|---|---|
| **GoDaddy DNS console** *(out-of-repo)* | Apply the records table above. Remove all forwarding / parking entries. Preserve all email records. |
| **GitHub user settings → Pages** *(out-of-repo)* | Add `jameslanzon.com` as a Verified domain via the `_github-pages-challenge-jameslanzon` TXT record. |
| **GitHub repo settings → Pages** *(out-of-repo)* | Confirm custom domain `jameslanzon.com`; tick "Enforce HTTPS" once the cert is provisioned. |
| `public/CNAME` | _No change_ — already contains `jameslanzon.com` (SPEC-001). |
| `.gitignore` | Add `*.pem`, `*.key`, `*.crt`, `*.csr`, `*.p12` defence-in-depth entries (AC-11). |
| `tests/integration/cname.spec.ts` | **Extend** to also fail on any `http://jameslanzon.com` or `http://www.jameslanzon.com` literal under `app/`, `content/`, or `public/` (AC-14). |
| `tests/integration/no-cert-files.spec.ts` | **New.** Walks the working tree (excluding `node_modules`, `.output`, `test-results`) and fails on any `*.pem` / `*.key` / `*.crt` / `*.csr` / `*.p12` file (AC-11). |
| `tests/e2e/https-health.spec.ts` | **New.** Runs against the live origin (apex + `www`, http + https). Cert chain assertion uses Node's `tls.connect` inside a Playwright `test.step` — Playwright's `request` API surfaces enough cert info via `securityDetails()` on the `Response` object. (AC-13.) |
| `playwright.config.ts` | Add a new project `production-smoke` that targets `https://jameslanzon.com` directly (no local web server). **Crucially, scope `webServer` to non-production projects only** — e.g. wrap the existing `webServer` config so it is `undefined` when `process.env.PLAYWRIGHT_PROJECT === 'production-smoke'`. Without this, every production-smoke run would re-execute `npm run generate && npm run preview` (wasted work, and a generate-time failure such as a missing `GITHUB_TOKEN` would block the smoke against the live origin). Excluded from the default `test:e2e` run; included only when `PLAYWRIGHT_PROJECT=production-smoke` is set. |
| `package.json` | Add script `"test:e2e:prod": "playwright test --project=production-smoke"`. |
| `.github/workflows/nightly-https-health.yml` | **New.** Cron `30 5 * * *` UTC and `workflow_dispatch`; runs `npm ci && npm run test:e2e:prod`. **Failure handling:** on a non-zero exit, the workflow opens a GitHub issue using a title-based dedup pattern: `gh issue list --label https-health --state open --search "HTTPS health failure" --json number --jq '.[0].number'` — if a number is returned, post a comment to the existing issue with the failed run URL; otherwise `gh issue create --label https-health --title "HTTPS health failure (<date>)" --body "<run URL + assertion summary>"`. The label `https-health` is created idempotently (`gh label create https-health --color B60205 --force`). This guarantees one open issue per outage, not one per cron tick. Implemented via a small inline shell step using the `GH_TOKEN` provided by `actions/checkout`. |
| `.github/workflows/deploy-pages.yml` | _No change_ — deploy semantics unchanged. |
| `docs/runbooks/https-godaddy-github-pages.md` | **New, deliverable.** §Runbook below, expanded into a standalone document. |
| `docs/decisions/ADR-002-https-on-github-pages.md` | **New.** Captures: registrar = GoDaddy (DNS only), CDN = none, cert provider = Let's Encrypt via GitHub Pages, HSTS without preload (initial), canonical host = apex. Authored from `docs/decisions/_TEMPLATE.md`. |
| `README.md` | Add a "Custom domain & HTTPS" section linking to the runbook and ADR-002. |

### Runbook (manual, one-time)

Step-by-step. Each step has a "verification" line that the
implementer pastes into the log.

1. **Pre-flight inventory + delegation check.** Open GoDaddy →
   `My Products` → `Domains` → `jameslanzon.com` → `DNS`. Take a
   screenshot of the entire `Records` list and the `Forwarding`
   tab. Save into the implementation log. Then capture each of:
   ```
   dig NS    jameslanzon.com +short
   dig MX    jameslanzon.com +short
   dig TXT   jameslanzon.com +short
   dig CAA   jameslanzon.com +short
   dig A     jameslanzon.com +short
   dig AAAA  jameslanzon.com +short
   dig CNAME www.jameslanzon.com +short
   ```
   into the log.
   *Verification:* the `NS` line lists `ns*.domaincontrol.com`
   (GoDaddy is authoritative) **— if it does not, STOP. Editing
   GoDaddy DNS will be a no-op. Identify and use the actual
   authoritative nameserver provider before continuing.** The `CAA`
   line is either empty or includes `0 issue "letsencrypt.org"`
   **— if a `CAA` exists that excludes Let's Encrypt, STOP and add
   `0 issue "letsencrypt.org"` first.** Save the `MX`/`TXT` outputs
   verbatim — they are the post-change preservation reference.
2. **Disable any active Domain Forwarding** on
   `jameslanzon.com` and on `www.jameslanzon.com`.
   *Verification:* the `Forwarding` tab shows "No forwarding
   rules" for both.
3. **Remove parking / stale records.** Delete any apex `A` /
   `AAAA` records pointing to non-GitHub IPs (notably
   `50.63.202.*` ranges) and any apex `CNAME`s.
   *Verification:* `dig jameslanzon.com A +short` returns an
   empty set after TTL expires.
4. **Add the eight GitHub Pages apex records** (4 × `A`,
   4 × `AAAA`) per the table in §DNS records. TTL 600.
   *Verification:* `dig jameslanzon.com A +short` and
   `dig jameslanzon.com AAAA +short` each return exactly four
   IPs from the GitHub set.
5. **Add the `www` `CNAME`** → `jameslanzon.github.io.` (note
   the trailing dot).
   *Verification:* `dig www.jameslanzon.com CNAME +short` returns
   `jameslanzon.github.io.`
6. **Verify the apex on GitHub.** GitHub → user `Settings` →
   `Pages` → `Add a domain`. Enter `jameslanzon.com`. Copy the
   `_github-pages-challenge-jameslanzon` TXT record value. Add
   it as a `TXT` record at GoDaddy with host
   `_github-pages-challenge-jameslanzon` and the supplied value.
   *Verification:* `dig _github-pages-challenge-jameslanzon.jameslanzon.com TXT +short`
   returns the supplied value. Click `Verify` on GitHub →
   indicator turns green.
7. **Set the repo custom domain.** GitHub → repo
   `Settings` → `Pages` → `Custom domain` → enter
   `jameslanzon.com` → `Save`. The Pages page now shows "DNS
   check successful".
   *Verification:* screenshot.
8. **Wait for Let's Encrypt issuance.** Typically minutes; up
   to an hour. Refresh the Pages page until "Enforce HTTPS"
   becomes a tickable checkbox.
9. **Tick "Enforce HTTPS".**
   *Verification:* `curl -sI http://jameslanzon.com | head -1`
   returns a 301/308; `curl -sI https://jameslanzon.com | head -1`
   returns 200.
9a. **Capture the live HSTS header** for AC-6 finalisation.
    Run `curl -sI https://jameslanzon.com | grep -i strict`. Paste
    the exact header value into the log. Compare against another
    known GitHub-Pages-custom-domain site (e.g.
    `curl -sI https://docs.github.com | grep -i strict` is **not**
    on Pages — use a known Pages site such as
    `https://github.community/` only if it is still on Pages, or
    accept the value observed on `jameslanzon.com` as canonical).
    Update AC-6 in the log to assert the observed values exactly.
9b. **Re-verify email preservation.** Run
    `dig MX jameslanzon.com +short`,
    `dig TXT jameslanzon.com +short`,
    `dig CAA jameslanzon.com +short` and assert byte-equal to the
    step-1 capture (modulo TTL refresh).
    *Verification:* diff is empty for record values.
10. **Run the production smoke locally:**
    `PLAYWRIGHT_PROJECT=production-smoke npm run test:e2e:prod`.
    All assertions in `tests/e2e/https-health.spec.ts` must pass.
11. **Enable the nightly workflow.** Confirm
    `.github/workflows/nightly-https-health.yml` runs on
    schedule (`workflow_dispatch` once to validate).

### Routing / pages

- No new routes.
- Canonical host is `https://jameslanzon.com`. `www` redirects to
  apex (handled by GitHub Pages). `http://*` redirects to
  `https://jameslanzon.com/<path>` (handled by GitHub Pages
  "Enforce HTTPS").
- **Note on the redirect target.** Because `public/CNAME` contains
  the apex form, GitHub Pages' "Enforce HTTPS" redirects
  `http://jameslanzon.com` directly to `https://jameslanzon.com/`
  (apex). If a future commit ever changes `public/CNAME` to
  `www.jameslanzon.com`, the redirect target flips and AC-2 / AC-3
  must be re-derived. The existing
  [tests/integration/cname.spec.ts](../../tests/integration/cname.spec.ts)
  guards the apex form.

### State / composables

- None. This spec is infrastructure + tests.

## Edge cases

- **Let's Encrypt rate limit (5 issuances per registered domain per
  week).** If the implementer toggles GitHub's custom-domain field
  off/on repeatedly during DNS troubleshooting, this trips. Result:
  "Enforce HTTPS" greyed out for ~7 days with no override. *Mitigation:*
  do **not** toggle the custom-domain field once set; fix DNS issues
  first, observe via `dig`, only then click `Save`. Documented in the
  runbook.
- **DNS propagation lag.** Expect 5–60 minutes typical, up to 24 h
  worst-case. The runbook explicitly tells the implementer to wait,
  not to retry.
- **GoDaddy "Forwarding (with masking)" silently re-enabled** after a
  GoDaddy UI redesign or account migration. *Mitigation:* the
  nightly smoke test (AC-13) catches this within 24 h via cert
  mismatch or non-200.
- **Renewal at 60 days** — Let's Encrypt issues 90-day certs; GitHub
  renews at ~60 days. If renewal fails (DNS hiccup, ACME challenge
  problem on GitHub's side), AC-13's "≥ 14 days remaining"
  assertion gives 30 days of headlights before any visitor sees a
  warning.
- **HSTS lockout.** Once a browser caches HSTS, downgrading to HTTP
  is impossible for `max-age` seconds. *Mitigation:* no `preload`
  in this iteration; `max-age=31536000` (1 year) is acceptable
  because rolling back is still possible by re-establishing HTTPS
  (GitHub's free Let's Encrypt is reliable enough that this is the
  right trade-off).
- **`public/CNAME` accidentally deleted.** GitHub Pages reverts to
  the default `<user>.github.io` host; the apex 404s; the cert is
  reissued for the wrong name. *Mitigation:* SPEC-001 AC-26 +
  `tests/integration/cname.spec.ts` already exist; this spec does
  not duplicate.
- **Mixed-content URL slips into a new content file.** AC-14 fails
  the build. The site stays HTTPS-only.
- **IPv6-only carrier on a flaky AAAA record.** The four `AAAA`
  records are anycast and rarely fail; failure of one IP
  transparently fails over. The smoke test resolves both families.
- **GitHub Pages outage.** Out of our control. The smoke test will
  report; we wait it out. No mitigation in this spec.
- **Custom-domain field cleared by a `gh-pages` re-deploy.** GitHub
  Pages sometimes drops the custom domain when a deploy uses an
  older Pages action. *Mitigation:* the
  [.github/workflows/deploy-pages.yml](../../.github/workflows/deploy-pages.yml)
  workflow already uses
  `actions/configure-pages` + `actions/deploy-pages`, which preserve
  the custom domain. Re-checked at implementation time.

## Test plan

| Layer | Test | Covers AC |
|---|---|---|
| integration | `tests/integration/no-cert-files.spec.ts` | AC-11, AC-12 |
| integration | `tests/integration/cname.spec.ts` (extend) | AC-10, AC-14 |
| e2e (production) | `tests/e2e/https-health.spec.ts` | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-13 |
| manual | Runbook screenshots in implementation log | AC-7, AC-8, AC-9, AC-15 |

## Task breakdown

Ordered checklist the implementer ticks as they go.

- [ ] **T1** — Author
      [docs/runbooks/https-godaddy-github-pages.md](../runbooks/https-godaddy-github-pages.md)
      from §Runbook above. Include placeholder for the live
      `_github-pages-challenge-jameslanzon` TXT value.
- [ ] **T2** — Author
      [docs/decisions/ADR-002-https-on-github-pages.md](../decisions/ADR-002-https-on-github-pages.md)
      from `docs/decisions/_TEMPLATE.md`. Status `accepted` once
      §Runbook is executed.
- [ ] **T3** — Add the `*.pem` / `*.key` / `*.crt` / `*.csr` /
      `*.p12` lines to `.gitignore`.
- [ ] **T4** — Implement
      [tests/integration/no-cert-files.spec.ts](../../tests/integration/no-cert-files.spec.ts).
- [ ] **T5** — Extend
      [tests/integration/cname.spec.ts](../../tests/integration/cname.spec.ts)
      with the mixed-content guard from AC-14.
- [ ] **T6** — Implement
      [tests/e2e/https-health.spec.ts](../../tests/e2e/https-health.spec.ts).
      Use Playwright's `response.securityDetails()` for cert info
      and `tls.connect` only as a fallback.
- [ ] **T7** — Add the `production-smoke` Playwright project and
      the `test:e2e:prod` npm script.
- [ ] **T8** — Author
      [.github/workflows/nightly-https-health.yml](../../.github/workflows/nightly-https-health.yml).
- [ ] **T9** — **Execute the runbook (out-of-repo).** Capture
      screenshots and `dig` outputs into the log. Expect a wait
      window for DNS and cert issuance.
- [ ] **T10** — Once HTTPS is live, run
      `npm run test:e2e:prod` locally. All green.
- [ ] **T11** — Update [README.md](../../README.md) with the
      "Custom domain & HTTPS" section.
- [ ] **T12** — Run `npm run typecheck && npm run lint && npm test`.
      All green.
- [ ] **T13** — Append a log under
      `docs/logs/YYYY-MM-DD-spec-003-*.md` with screenshots, dig
      outputs, and curl outputs.
- [ ] **T14** — Flip ADR-002 status to `accepted`. Flip this spec
      to `done`. Flip JNY-003 to `implemented`.

## Risks & rollback

- **Risk: Let's Encrypt rate limit tripped.** Mitigation as above.
  *Rollback:* none required — wait 7 days; site remains reachable
  on HTTP only in the worst case (the DNS records still resolve).
- **Risk: GoDaddy DNS console UX changes break the runbook.**
  *Mitigation:* runbook describes intent, not pixel positions.
  Annual review.
- **Risk: HSTS lockout.** Mitigated by withholding `preload` and
  by GitHub Pages' historical reliability. *Rollback:* if HTTPS
  breaks, restore via the runbook; visitors with cached HSTS will
  reconnect successfully once HTTPS is restored.
- **Risk: A future agent commits a `*.pem` to the repo.** AC-11
  test fails the build.
- **Risk: A future agent introduces an `http://jameslanzon.com`
  literal.** AC-14 test fails the build.
- **Rollback procedure:** to revert HTTPS enforcement (e.g. for
  emergency debugging), un-tick "Enforce HTTPS" in the repo Pages
  settings — HSTS keeps existing visitors on HTTPS for one year, so
  the rollback is partial. Full rollback is **not supported** by
  design; this is the cost of HSTS and is acceptable.

## Open questions

- Should we add a **"`https://www.jameslanzon.com` returns 200, not
  301"** alternate canonical strategy? Spec answer: **no** — apex
  canonical is fixed here; `www` redirects.
- Should the nightly workflow open a GitHub issue on failure or
  just fail the workflow? Spec answer: **open an issue**, labelled
  `https-health`, deduplicated by title — implemented in T8.
- Should we register `jameslanzon.dev` / `.eu` as defensive
  domains? Out of scope; future ADR.
