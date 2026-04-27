---
id: RUNBOOK-https-godaddy-github-pages
title: "HTTPS for jameslanzon.com — GoDaddy DNS + GitHub Pages + Let's Encrypt"
status: in-progress
related-specs: [SPEC-003]
related-adrs: [ADR-002]
owner: "James Lanzon"
last-executed: "TBD — to be filled in by the implementer in the SPEC-003 log"
---

# Runbook — HTTPS for `jameslanzon.com`

> **Source of truth.** This runbook is the authoritative manual checklist
> for the one-time configuration that puts `https://jameslanzon.com` on a
> Let's Encrypt certificate via GitHub Pages. It implements
> [SPEC-003](../specs/SPEC-003-https-custom-domain.md) §Runbook. The
> "why" lives in [JNY-003](../journeys/JNY-003-https-custom-domain.md)
> and [ADR-002](../decisions/ADR-002-https-on-github-pages.md). The
> automated guards live under `tests/integration/` and `tests/e2e/`.
>
> **Audience.** James (domain owner) executing the steps once, plus any
> future agent re-running the runbook after a registrar move, a DNS
> outage, or a `gh-pages`-style regression.

## Pre-conditions

- Repo `koshux/Portfolio` deployed to GitHub Pages via
  `.github/workflows/deploy-pages.yml`.
- `public/CNAME` contains exactly `jameslanzon.com`.
- `jameslanzon.com` is registered at GoDaddy with the **default**
  GoDaddy nameservers (`ns*.domaincontrol.com`). Step 1 verifies this.
- You have console access to GoDaddy and `Owner` access to
  `koshux/Portfolio` and to the user-level GitHub account for
  `jameslanzon`.

## Required tools

- A DNS query tool. **Pick whichever is on your machine** — the
  runbook's `dig +short` snippets are just shorthand for "give me the
  answer values". The Windows-equivalent commands are listed inline at
  every verification step below.
  - **macOS / Linux / WSL**: `dig` (BIND tools).
  - **Windows PowerShell** (recommended on Windows): the built-in
    `Resolve-DnsName` cmdlet — cleaner output than `nslookup` and
    requires no install.
  - **Windows fallback**: `nslookup` (built-in; needed for the `CAA`
    type because PowerShell 5.1's `Resolve-DnsName` doesn't recognise
    it natively).
- `curl` 7.x+ (PowerShell's `curl` alias is `Invoke-WebRequest` — use
  `curl.exe` on Windows).
- `openssl` (only used in step 9b for the cert-issuer cross-check).
  On Windows, ships with Git for Windows under `C:\Program Files\Git\
  usr\bin\openssl.exe`, or install via `choco install openssl`.
- The GitHub web UI.
- The GoDaddy DNS console.

### Glossary — what's an "apex" and what's a "subdomain"?

If this is your first DNS rodeo, the runbook's wording around "apex"
and "subdomain CNAME" trips a lot of people up. Two definitions that
will make the rest of the runbook click:

- **Apex domain** (also called "naked domain" or "root domain") — the
  bare form of your domain with **no prefix**. For this site:
  `jameslanzon.com`. In the GoDaddy console you address the apex by
  setting `Host = @`.
- **Subdomain** — anything to the left of the apex. `www.jameslanzon.com`,
  `email.jameslanzon.com`, `blog.jameslanzon.com` are all subdomains.
  In the GoDaddy console you address them by setting `Host = www`,
  `Host = email`, etc. (no trailing `.jameslanzon.com` — GoDaddy
  appends the apex automatically).

The DNS specification **forbids** a `CNAME` record at the apex (it
conflicts with mandatory `SOA`/`NS` records that live there). That is
why this runbook has you point the apex at GitHub Pages' IP addresses
via `A`/`AAAA` records (step 4) and only uses a `CNAME` for the `www`
subdomain (step 5) — a CNAME on `www` is perfectly legal. **Subdomain
CNAMEs for unrelated services (e.g. `email → email.secureserver.net.`
for GoDaddy webmail) are also legitimate and must be left alone**
unless you're deliberately switching off that service.

## Hard rules

1. **Do not toggle the GitHub custom-domain field off/on while
   troubleshooting.** Each toggle counts towards the Let's Encrypt
   "5 issuances per registered domain per week" rate limit. A trip
   greys out "Enforce HTTPS" for ~7 days with no override.
2. **Do not edit `MX`, SPF `TXT`, `_dmarc`, or `_domainkey` records.**
   Email is out of scope. Step 1 captures their pre-change state and
   step 9b verifies they were preserved byte-equal.
3. **Do not enable HSTS preload** in this iteration. See
   [ADR-002](../decisions/ADR-002-https-on-github-pages.md) §Consequences.
4. **Paste every `dig`/`curl` output into the implementation log** at
   `docs/logs/<YYYY-MM-DD>-spec-003-runbook.md`. The runbook is the
   evidence; without the log we cannot satisfy AC-7 / AC-8 / AC-9 /
   AC-15.

---

## Steps

### 1. Pre-flight inventory

GoDaddy → `My Products` → `Domains` → `jameslanzon.com` → `DNS`.

Screenshot the entire `Records` list and the `Forwarding` tab into the
log.

Then capture each record type. Use the dialect that matches your
shell. Pin to a public resolver (`8.8.8.8` is Google) to bypass any
local DNS cache.

**macOS / Linux / WSL (`dig`):**

```sh
dig NS    jameslanzon.com +short
dig MX    jameslanzon.com +short
dig TXT   jameslanzon.com +short
dig CAA   jameslanzon.com +short
dig A     jameslanzon.com +short
dig AAAA  jameslanzon.com +short
dig CNAME www.jameslanzon.com +short
```

**Windows PowerShell (`Resolve-DnsName`):**

```powershell
Resolve-DnsName jameslanzon.com -Type NS    -Server 8.8.8.8 | Select-Object -ExpandProperty NameHost
Resolve-DnsName jameslanzon.com -Type MX    -Server 8.8.8.8 | Select-Object Preference, NameExchange
Resolve-DnsName jameslanzon.com -Type TXT   -Server 8.8.8.8 | Select-Object -ExpandProperty Strings
Resolve-DnsName jameslanzon.com -Type A     -Server 8.8.8.8 | Select-Object -ExpandProperty IPAddress
Resolve-DnsName jameslanzon.com -Type AAAA  -Server 8.8.8.8 | Select-Object -ExpandProperty IPAddress
Resolve-DnsName www.jameslanzon.com -Type CNAME -Server 8.8.8.8 | Select-Object -ExpandProperty NameHost
# CAA is not natively recognised by PowerShell 5.1 — use nslookup:
nslookup -type=CAA jameslanzon.com 8.8.8.8
```

> 💡 If `nslookup -type=CAA` reports "Non-existent domain" or returns
> nothing, your `CAA` record set is **empty**. That's the default and
> it's fine — Let's Encrypt issuance is permitted by default.

**Verify:**

- `NS` lists `ns*.domaincontrol.com` → GoDaddy is authoritative. **If
  not, STOP** — editing GoDaddy DNS will be a no-op. Identify the real
  authoritative provider before continuing.
- `CAA` is empty **or** contains `0 issue "letsencrypt.org"`. **If a
  `CAA` exists that excludes Let's Encrypt, STOP** and add
  `0 issue "letsencrypt.org"` first.
- Save the `MX`/`TXT` outputs verbatim — they are the post-change
  preservation reference.

### 2. Disable Domain Forwarding

GoDaddy → `Domains` → `jameslanzon.com` → `Forwarding` tab.

Disable any active forwarding rule for both `jameslanzon.com` and
`www.jameslanzon.com`.

**Verify:** the `Forwarding` tab shows "No forwarding rules" for both
hosts.

### 3. Remove parking / stale records

In the `Records` tab, delete:

- Any apex `A` / `AAAA` record pointing to GoDaddy parking IPs
  (`50.63.202.*`, `184.168.*.*`, `184.169.*.*`).
- Any **apex** `CNAME` — i.e. a `CNAME` whose **Host** column reads
  `@` (or your bare domain). See the Glossary above. **Subdomain**
  CNAMEs (Host = `www`, `email`, `blog`, etc.) are **legal and
  unrelated to this step** — leave them alone.
- Any stale `_acme-challenge.*` `TXT` records left over from a
  previous manual cert attempt.

> ✅ **Common case from a previous portfolio.** If your domain
> already pointed at GitHub Pages, you may already have:
> - A `CNAME` with Host `www` and value `<user>.github.io.` —
>   that's exactly what step 5 will ask for. **Leave it.**
> - A `CNAME` with Host `email` and value `email.secureserver.net.`
>   — that's GoDaddy webmail; unrelated to your site. **Leave it.**
> - Two or more apex `A` records on `185.199.108-111.153` —
>   already-correct GitHub Pages IPs (possibly an incomplete subset
>   from years ago). Step 4 makes the set complete; you can either
>   delete and re-add the full four, or just add the missing ones.

**Verify:** if you deleted any apex `A`/`AAAA` records, after the
local TTL expires (a few minutes — record the TTL from step 1),
`dig jameslanzon.com A +short` (or `Resolve-DnsName jameslanzon.com
-Type A -Server 8.8.8.8`) returns only the IPs you intend to keep.

### 4. Add the eight GitHub Pages apex records

**Why eight records?** Visitors will type `jameslanzon.com` (no
`www`), so the **apex** has to resolve to GitHub Pages' servers.
Because a `CNAME` is illegal at the apex (see Glossary), GitHub
publishes a small set of **anycast IP addresses** that all serve the
same Pages content. "Anycast" means the same IP is announced from
multiple data centres worldwide; the visitor's network picks the
nearest one automatically. GitHub publishes **four IPv4 addresses**
(the `A` rows below) and **four IPv6 addresses** (the `AAAA` rows).
We add all eight so visitors on either internet protocol get
redundancy if one data centre is degraded.

> ⚠️ **Re-verify the IP literals against
> <https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site>
> before applying.** Stale IPs in this runbook are worse than a 30-second
> cross-check.

| # | Host | Type | Value | TTL |
|---|---|---|---|---|
| 1 | `@` | `A` | `185.199.108.153` | 600 (or GoDaddy's "1 Hour") |
| 2 | `@` | `A` | `185.199.109.153` | 600 |
| 3 | `@` | `A` | `185.199.110.153` | 600 |
| 4 | `@` | `A` | `185.199.111.153` | 600 |
| 5 | `@` | `AAAA` | `2606:50c0:8000::153` | 600 |
| 6 | `@` | `AAAA` | `2606:50c0:8001::153` | 600 |
| 7 | `@` | `AAAA` | `2606:50c0:8002::153` | 600 |
| 8 | `@` | `AAAA` | `2606:50c0:8003::153` | 600 |

> 💡 **GoDaddy TTL UI quirk.** The GoDaddy `Records` editor uses
> presets ("1/2 Hour", "1 Hour", "Custom"). "1 Hour" is fine — 600
> seconds is the preference but not strict. Don't pick anything
> longer than "1 Hour" while you're still iterating; long TTLs slow
> down corrections.

**Step-by-step in the GoDaddy `Records` tab:**

1. Click **Add** (or **Add New Record**) for each row in the table.
2. Set `Type`, `Host = @`, paste the `Value`, set `TTL = 1 Hour`.
3. Click **Save** for each row.
4. Repeat until all eight new rows exist on top of any existing
   correct GitHub Pages IPs.

**Verify** (after a few minutes for propagation):

*macOS / Linux / WSL:*

```sh
dig jameslanzon.com A    +short
dig jameslanzon.com AAAA +short
```

*Windows PowerShell:*

```powershell
Resolve-DnsName jameslanzon.com -Type A    -Server 8.8.8.8 | Select-Object -ExpandProperty IPAddress
Resolve-DnsName jameslanzon.com -Type AAAA -Server 8.8.8.8 | Select-Object -ExpandProperty IPAddress
```

Each must return **exactly four** IPs from the GitHub Pages anycast
set. If you only see two or three, wait another 10–15 minutes —
GoDaddy occasionally takes longer to publish all rows. If the count
stays stuck after 30 minutes, re-open the `Records` tab and confirm
all eight rows are present and saved.

### 5. Add the `www` CNAME

| Host | Type | Value | TTL |
|---|---|---|---|
| `www` | `CNAME` | `koshux.github.io.` (trailing dot) | 600 |

> ℹ️ The repository is `koshux/Portfolio`, so the GitHub Pages user
> host is `koshux.github.io` — **not** `jameslanzon.github.io`. Earlier
> drafts of the spec used `jameslanzon.github.io.` placeholder text;
> the correct value is `koshux.github.io.` with a trailing dot.
>
> If your domain previously pointed at the older portfolio, this
> CNAME is **probably already in place**. Confirm in the `Records`
> tab — if you see `www → koshux.github.io.`, this step is done.

**Verify:**

*macOS / Linux / WSL:*

```sh
dig www.jameslanzon.com CNAME +short
# → koshux.github.io.
```

*Windows PowerShell:*

```powershell
Resolve-DnsName www.jameslanzon.com -Type CNAME -Server 8.8.8.8 |
  Select-Object -ExpandProperty NameHost
# → koshux.github.io
```

### 6. Verify the apex on GitHub (user level)

GitHub → click your avatar → `Settings` → `Pages` → `Add a domain`.

1. Enter `jameslanzon.com`.
2. GitHub displays a `_github-pages-challenge-jameslanzon` host with a
   long random TXT value.
3. Add a TXT record at GoDaddy:
   - Host: `_github-pages-challenge-jameslanzon`
   - Type: `TXT`
   - Value: *(paste verbatim from the GitHub UI)*
   - TTL: 600

**Verify:**

*macOS / Linux / WSL:*

```sh
dig _github-pages-challenge-jameslanzon.jameslanzon.com TXT +short
# → "<the value from the GitHub UI>"
```

*Windows PowerShell:*

```powershell
Resolve-DnsName _github-pages-challenge-jameslanzon.jameslanzon.com `
  -Type TXT -Server 8.8.8.8 | Select-Object -ExpandProperty Strings
# → <the value from the GitHub UI>
```

Click `Verify` on the GitHub UI. The badge turns **green** ("Verified").

> 💡 **Why user-level verification?** Per
> [SPEC-003 AC-9](../specs/SPEC-003-https-custom-domain.md#acceptance-criteria),
> verifying at the user level prevents a different GitHub user from
> claiming `jameslanzon.com` on their own Pages site. It is independent
> of the per-repo custom-domain field.

### 7. Set the repo custom domain

GitHub → repo `koshux/Portfolio` → `Settings` → `Pages` → `Custom domain`.

1. Enter `jameslanzon.com`.
2. Click `Save`.
3. The page now shows "DNS check successful" with a green check.

**Verify:** screenshot into the log.

### 8. Wait for Let's Encrypt issuance

Typically a few minutes; can take up to an hour. Refresh the Pages
settings page until **"Enforce HTTPS"** becomes a tickable checkbox
(rather than greyed out).

> 💡 **If "Enforce HTTPS" stays greyed out for >1 hour:** check `dig`
> output again — if any apex `A` IP is missing or wrong, the ACME
> HTTP-01 challenge fails silently. Fix the DNS records (do **not**
> toggle the custom-domain field) and wait another 30 minutes.

### 9. Tick "Enforce HTTPS"

**Verify:**

```sh
curl -sI http://jameslanzon.com | Select-Object -First 1
# → HTTP/1.1 301 Moved Permanently  (or 308)
curl -sI https://jameslanzon.com | Select-Object -First 1
# → HTTP/2 200
curl -sIL http://jameslanzon.com
# → exactly two responses: 301/308 then 200
```

(On bash/zsh use `head -1` instead of `Select-Object -First 1`.)

### 9a. Capture the live HSTS header

```sh
curl -sI https://jameslanzon.com | Select-String -Pattern '^strict-transport-security' -CaseSensitive:$false
```

Paste the **exact** header value into the log. SPEC-003 AC-6 finalises
its assertion against the value observed here — the spec deliberately
does not pre-commit to `includeSubDomains` because GitHub Pages'
historical behaviour has varied. Examples seen in the wild:

- `strict-transport-security: max-age=31536000`
- `strict-transport-security: max-age=31536000; includeSubDomains`

Whichever you observe, the e2e smoke
([tests/e2e/https-health.spec.ts](../../tests/e2e/https-health.spec.ts))
asserts `max-age` ≥ 31536000 and **does not** assert `includeSubDomains`
or `preload` (we explicitly do not opt into preload — see ADR-002).

### 9b. Re-verify email preservation + cert issuer

```sh
dig MX  jameslanzon.com +short
dig TXT jameslanzon.com +short
dig CAA jameslanzon.com +short
```

Diff against the step-1 capture. Values must be byte-equal (TTLs may
differ; values must not).

```sh
openssl s_client -connect jameslanzon.com:443 -servername jameslanzon.com </dev/null 2>NUL `
  | openssl x509 -noout -issuer -subject -ext subjectAltName
```

**Verify:**

- `issuer=` line contains `Let's Encrypt` and a current LE
  intermediate (`R3`, `R10`, `E1`, `E5`, or successor).
- `subject=` line contains `jameslanzon.com`.
- `subjectAltName` contains both `jameslanzon.com` and
  `www.jameslanzon.com`.

### 10. Run the production smoke locally

```sh
$env:PLAYWRIGHT_PROJECT = 'production-smoke'
npm run test:e2e:prod
```

(Or `PLAYWRIGHT_PROJECT=production-smoke npm run test:e2e:prod` on
bash/zsh.)

All assertions in
[tests/e2e/https-health.spec.ts](../../tests/e2e/https-health.spec.ts)
must pass.

### 11. Enable the nightly workflow

Confirm
[.github/workflows/nightly-https-health.yml](../../.github/workflows/nightly-https-health.yml)
is on `main` and triggers via `workflow_dispatch` once. Inspect the
job log; it must end green and post no GitHub issue.

The workflow opens a single deduplicated GitHub issue (label
`https-health`) on failure. One open issue per outage, not one per
cron tick.

---

## Rollback

Full rollback is **not supported** by design. Once HSTS is set, every
visitor's browser caches it for `max-age` seconds (1 year). If HTTPS
breaks:

1. Re-establish HTTPS by re-running the runbook (the cause is almost
   always a regressed DNS record or a deleted `public/CNAME`).
2. The nightly smoke test (AC-13) gives you ≥ 14 days of headlights
   before any visitor sees a cert warning.
3. If absolutely necessary for emergency debugging, un-tick "Enforce
   HTTPS" — but be aware that browsers with cached HSTS will still
   refuse plain HTTP for the remainder of `max-age`.

This trade-off is the cost of HSTS and is acceptable per ADR-002.

## Failure modes & remedies

| Symptom | Diagnosis | Remedy |
|---|---|---|
| GitHub Pages: "DNS check unsuccessful" | One or more `A` IPs missing or wrong; `www` CNAME missing | Re-check the records table in step 4–5. Wait for TTL. Do **not** toggle the custom-domain field. |
| GitHub Pages: "Enforce HTTPS" stays greyed out >1h | ACME HTTP-01 challenge failed (DNS lag, or a `CAA` record forbids LE) | Verify all four apex `A` IPs resolve. Re-check `dig CAA jameslanzon.com +short`. Wait. |
| Browser: "Your connection is not private" with `NET::ERR_CERT_AUTHORITY_INVALID` | Cert was issued for the wrong host (e.g. `<user>.github.io` because `public/CNAME` was deleted) | Restore `public/CNAME` containing `jameslanzon.com`. Re-deploy. The cert reissues automatically. |
| `curl https://jameslanzon.com` works, `curl https://www.jameslanzon.com` fails | Missing `www` CNAME, or LE has not yet issued the SAN cert covering `www` | Verify step 5. Wait up to 1h. |
| Email stops working after the change | One of MX/SPF/DKIM/DMARC was accidentally deleted in steps 2–3 | Restore from the step-1 capture. (This is the reason step 1 captures them verbatim.) |
| Let's Encrypt rate limit hit (503 / "too many certificates") | The custom-domain field was toggled too many times in a week | **Wait 7 days.** Do not retry. The site remains reachable on HTTP only in the worst case. |

## Annual review

GoDaddy's DNS console UX changes occasionally. Re-read this runbook
once per year (the renewal cycle for the domain itself is a natural
trigger) and update step references. The intent is stable; the
pixel positions are not.
