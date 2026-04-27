---
id: JNY-003
title: "HTTPS at https://jameslanzon.com via GitHub Pages + Let's Encrypt"
status: implemented
created: 2026-04-27
owner: "James Lanzon"
related-specs: [SPEC-003]
---

# JNY-003 — HTTPS at `https://jameslanzon.com`

## Persona

**Two parties, one outcome.**

1. **The recruiter / peer / client** from [JNY-001](JNY-001-portfolio-revamp-iteration-1.md) —
   unchanged. They click a link to `jameslanzon.com` and expect a green
   padlock. A browser warning ("Not secure", "Your connection is not
   private", or worse a full interstitial) destroys the iteration-1
   credibility goal in a single screen.
2. **James, the domain owner.** He registered `jameslanzon.com` at
   **GoDaddy** and hosts the site on **GitHub Pages** (static output from
   `nuxt generate`, see [AGENTS.md §1](../../AGENTS.md#1-hard-rules-do-not-break)).
   He needs HTTPS to "just work" without paying GoDaddy for an SSL product
   he does not need, without standing up a CDN in front of GitHub Pages,
   and without breaking the GitHub Pages "Enforce HTTPS" toggle.

## Trigger

The site is currently reachable on `http://jameslanzon.com` only — or the
HTTPS variant fails / shows a certificate mismatch — because the DNS
records at GoDaddy are not set to GitHub Pages' published IPs, or because
GoDaddy's "domain forwarding" is masking the apex with a 301 from
GoDaddy's parking infrastructure (which **cannot** carry the GitHub
Pages-issued Let's Encrypt certificate). Recruiters arriving from a
LinkedIn or email link see either a browser warning or a redirect chain
that ends on an HTTP page.

## Goal

`https://jameslanzon.com` and `https://www.jameslanzon.com` both serve
the iteration-1 site over a valid, automatically-renewing TLS
certificate, with `http://` requests permanently redirected to `https://`
at the edge. The site owner pays nothing extra to GoDaddy, holds no
certificate material on disk, and never has to renew anything by hand.

## Journey steps

### Visitor

1. Visitor types `jameslanzon.com` (or clicks a link to the bare apex,
   `www.`, or the `http://` variant) into the browser.
2. The browser is redirected once to `https://jameslanzon.com` and the
   page loads with a valid padlock. No mixed-content warnings, no
   certificate-name mismatch, no interstitial.
3. The visitor sees the same iteration-1 hero, contact icons, and live
   signal. The redirect is invisible and cannot be perceived as a
   slowdown.
4. After their first visit, the browser remembers (via HSTS) that this
   origin is HTTPS-only; the `http://` round trip is skipped on every
   subsequent visit.

### Site owner (James)

1. James logs into GoDaddy's DNS console for `jameslanzon.com`.
2. He removes any existing **Domain Forwarding** rules and any A/CNAME
   records that point at GoDaddy parking, GoDaddy hosting, or stale
   hosts.
3. He sets the four GitHub Pages apex `A` records, the four `AAAA`
   records, and a `CNAME` for `www` pointing to his
   `<username>.github.io` host. (Exact values belong in the spec.)
4. He waits for DNS to propagate (typically minutes; up to 24 h in the
   worst case).
5. In the GitHub repository settings, on the Pages tab, he confirms
   that the custom domain `jameslanzon.com` is set, that GitHub has
   verified the DNS, and that the **"Enforce HTTPS"** checkbox is
   available and ticked.
6. GitHub provisions a Let's Encrypt certificate automatically. James
   does not download, install, renew, or rotate any key material. He
   never logs into Let's Encrypt, never runs `certbot`, never touches
   GoDaddy's "SSL Certificates" product page.
7. James opens `https://jameslanzon.com` from a fresh browser profile,
   sees the padlock, and runs an SSL Labs / `curl -vI` check to
   confirm certificate, chain, and HSTS.

## Success criteria

- [ ] `https://jameslanzon.com` returns HTTP 200 with a valid Let's
      Encrypt certificate whose Subject Alternative Names include both
      `jameslanzon.com` and `www.jameslanzon.com`.
- [ ] `http://jameslanzon.com` returns a single 301/308 redirect to
      `https://jameslanzon.com` (no redirect chain, no http→http hop).
- [ ] `http://www.jameslanzon.com` and `https://www.jameslanzon.com`
      either redirect to the apex or serve the same content with a valid
      certificate — the spec picks one canonical host and enforces it.
- [ ] The certificate auto-renews via GitHub Pages without any manual
      intervention; renewal is observable by checking certificate
      `notBefore` after 60 days of uptime.
- [ ] No GoDaddy SSL product is purchased; the GoDaddy bill for the
      domain is **registration only**.
- [ ] No private keys, certificate files, ACME challenges, or
      `.well-known/` carve-outs exist in the repository or in
      `public/`.
- [ ] GoDaddy "Domain Forwarding" / "Domain Masking" is **off** for
      `jameslanzon.com`. Verifiable by inspecting the DNS console.
- [ ] An `HSTS` response header is present on the served HTTPS response
      with at least `max-age=31536000; includeSubDomains` (delivered by
      GitHub Pages once "Enforce HTTPS" is on; spec confirms exact
      value).
- [ ] An automated check (e.g. an integration test or CI job hitting
      `https://jameslanzon.com`) verifies status, certificate validity,
      and redirect behaviour after each deploy.
- [ ] `public/CNAME` continues to contain `jameslanzon.com` and is
      preserved by `nuxt generate` into `.output/public/CNAME` (see
      iteration-1 contract).

## Failure modes

- GoDaddy "Domain Forwarding (with masking)" is left on. GitHub never
  sees the domain, never issues a cert, and visitors land on an iframe
  of GitHub Pages served from GoDaddy's HTTP parking. Padlock fails.
- Only `A` records (no `AAAA`) are set, so IPv6-first networks (mobile
  carriers in particular) connect to a stale IPv6 host or fail.
- Stale GoDaddy A records (parking IPs) coexist with the GitHub Pages
  IPs, causing intermittent failures (round-robin DNS hits the wrong
  origin and either 404s or trips a cert mismatch).
- GitHub's domain verification is not completed (the `TXT` record in
  *user-level* DNS settings is missing), so "Enforce HTTPS" is greyed
  out forever.
- A previous misconfiguration caused Let's Encrypt to rate-limit the
  apex. The cert provisioning button is greyed out for hours/days. The
  spec must mention this trap and how to wait it out without making it
  worse.
- The CNAME file is removed from `public/` (or the build accidentally
  drops it) on a future deploy. GitHub Pages reverts to the default
  `<username>.github.io` host, the cert is reissued for the wrong name,
  and the apex breaks.
- Mixed content: a hard-coded `http://` URL in `nuxt.config.ts`,
  `content/`, or the OG image causes the browser to drop the padlock.
  Iteration 1 already uses `https://jameslanzon.com/og/og-image.png`
  (see [SPEC-001](../specs/SPEC-001-portfolio-revamp-iteration-1.md)),
  but any new content must be checked.
- HSTS is enabled too aggressively (`preload`) before the configuration
  is proven stable, locking visitors out of the site for up to a year
  if HTTPS later breaks.

## Out of scope

- Moving the registrar away from GoDaddy (e.g. to Cloudflare or
  Porkbun). That may be a future ADR; this journey treats GoDaddy as a
  fixed input.
- Putting Cloudflare (or any CDN) in front of GitHub Pages. The
  iteration-1 contract is "GitHub Pages static output, nothing in
  front of it"; introducing a CDN is a separate decision with its own
  trade-offs (origin pulls, cache purging, certificate ownership) and
  is explicitly excluded here.
- HSTS preload list submission. Out of scope until the configuration
  has been stable for at least three months.
- Subdomains other than `www` (e.g. `blog.`, `cv.`). Not in scope; the
  spec only needs to handle the apex and `www`.
- Email DNS (MX, SPF, DKIM, DMARC). Email is handled separately and
  must not be disturbed by the changes in this journey — the spec
  should explicitly **preserve** any existing MX/TXT records.

## Open questions

- Which canonical host does James prefer: `jameslanzon.com` (apex) or
  `www.jameslanzon.com`? The journey assumes apex (matches existing
  `public/CNAME`), but the spec must make it explicit and configure
  the redirect accordingly.
- Are there any existing GoDaddy records that must be preserved
  (email MX, verification TXT for Google Workspace, etc.)? The
  implementer must inventory the current zone before changing it.
- Does James want a CI smoke test that fails the build if
  `https://jameslanzon.com` ever returns non-200 or a non-Let's-Encrypt
  certificate? (Recommended; included as a success criterion above.)

---

## Implementation context (ultra-think) — for the spec author

> Journeys describe the *why*; this section is the unusually-deep
> technical context the user explicitly asked for, kept inside the
> journey because it constrains the spec materially. The spec author
> should consume this and translate it into normative tasks; do not
> treat the bullets below as acceptance criteria.

### The fundamental insight

**You do not need an SSL certificate from GoDaddy.** GoDaddy will gladly
sell you one, and a customer-support agent will gladly tell you that
you "need" one. You do not. GitHub Pages issues a free, automatically
renewing **Let's Encrypt** certificate for any custom domain whose DNS
points correctly at GitHub Pages' edge. The certificate is provisioned
and renewed by GitHub on your behalf; you never see a private key.

The whole job, therefore, is **DNS hygiene at GoDaddy** plus **two
checkboxes on GitHub**.

### Why GoDaddy SSL is the wrong tool here

A traditional SSL product (the kind GoDaddy sells) requires you to:

1. Generate a CSR on the origin host.
2. Hand the CSR to the CA, complete validation.
3. Install the issued cert + intermediate chain on the origin host.
4. Renew annually.

GitHub Pages is the origin host. **You cannot install a cert on it** —
it is a managed service. So a GoDaddy-issued cert has nowhere to live
unless you also put a GoDaddy-hosted reverse proxy in front of GitHub
Pages, which is both expensive and pointless when the GitHub-issued
Let's Encrypt cert is free and auto-renewed.

### What GoDaddy is for here

**Authoritative DNS only.** The GoDaddy DNS console is the place where
you publish records that tell the world "the apex `jameslanzon.com`
lives at these IPv4/IPv6 addresses, and `www.jameslanzon.com` is a
CNAME of `<username>.github.io`". That is it. No SSL purchase, no
hosting, no email forwarding (unless already configured for email,
which must be preserved).

### The DNS records, conceptually

- **Apex `A` records → four GitHub Pages anycast IPv4 addresses.**
  Apex domains cannot legally be `CNAME`s under RFC 1034, which is why
  GitHub publishes flat `A` records instead. GoDaddy DNS supports
  multiple `A` records on the same host; you add four of them.
- **Apex `AAAA` records → four GitHub Pages anycast IPv6 addresses.**
  Mandatory in 2026. Many mobile carriers and corporate networks are
  IPv6-first.
- **`www` `CNAME` → `<github-username>.github.io.`** This is what
  GitHub Pages uses to identify your repo as the target. It also lets
  GitHub re-IP its edge without you ever having to update GoDaddy.
- **No `ALTN` / `ANAME` / `URL Redirect` / `Forwarding` records.**
  GoDaddy offers a "Forwarding" feature that issues a 301 from a
  GoDaddy-hosted server. That intercepts traffic *before* GitHub sees
  it, prevents Let's Encrypt issuance, and serves visitors a GoDaddy
  page. It must be **off**.
- **Existing email records (`MX`, SPF/DKIM `TXT`, autodiscover,
  `_dmarc`) — preserve verbatim.** Changing apex `A` records does not
  affect mail delivery; *removing* MX records does. The implementer
  must list-and-preserve.

The spec, not this journey, will list the exact IP addresses and host
strings — those are GitHub-published and may shift; consult
GitHub's "Managing a custom domain for your GitHub Pages site" docs at
implementation time rather than copying stale values from this
journey.

### The GitHub side, conceptually

Two things, in order:

1. **Verify the apex domain at the user (or org) level.** GitHub asks
   you to add a `_github-pages-challenge-<user>` `TXT` record under
   the apex. This proves to GitHub that you own the domain and lets
   it refuse domain takeovers. Without verification, "Enforce HTTPS"
   stays disabled forever — a frequent mystery for first-timers.
2. **In the repo's Pages settings, set the custom domain to
   `jameslanzon.com`** (this writes/expects the `public/CNAME` file
   that already exists in the repo) **and tick "Enforce HTTPS"** as
   soon as GitHub finishes provisioning the cert. GitHub greys the
   checkbox until DNS is correct *and* Let's Encrypt has issued.

### Order of operations (and why it matters)

DNS first, then GitHub Pages, then "Enforce HTTPS". If you flip the
order, you can trip Let's Encrypt's per-domain rate limits (5 cert
issuances per registered domain per week) by repeatedly attempting to
issue against a misconfigured zone. Each failed issuance costs you
nothing but counts against the limit. If you trip the limit, the
"Enforce HTTPS" toggle simply refuses to enable for ~7 days and there
is no override.

The journey's success-criteria CI smoke test (above) is the long-term
guard against this regressing silently after the initial setup.

### Risks the spec must enumerate

1. **GoDaddy domain forwarding silently re-enabling itself** after a
   GoDaddy UI redesign or account migration. Add a documented manual
   check; ideally also an external monitor.
2. **Cert renewal at 60 days** failing because DNS briefly broke.
   Let's Encrypt retries; the CI smoke test gives you headlights.
3. **HSTS preload** being enabled prematurely. Recommend
   `max-age=31536000; includeSubDomains` *without* `preload` until
   stable for ≥ 3 months, then a separate ADR to add `preload` and
   submit to the preload list.
4. **`public/CNAME` being deleted** by a future refactor. Add a
   `tests/integration/cname.spec.ts`-style guard (one already exists,
   per `tests/integration/cname.spec.ts`) to assert the generated
   output still contains `jameslanzon.com` after `nuxt generate`.
5. **Mixed-content regressions** when a new image, font, or analytics
   script (see [JNY-002](JNY-002-restore-analytics.md)) is added with
   an `http://` URL. Lint or test should reject `http://` URLs in
   `content/`, `app/`, and built HTML.
