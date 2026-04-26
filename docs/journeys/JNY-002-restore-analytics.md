---
id: JNY-002
title: "Restore Google Analytics on the portfolio"
status: approved
created: 2026-04-27
owner: "James Lanzon"
related-specs: [SPEC-002]
---

# JNY-002 — Restore Google Analytics on the portfolio

## Persona

**James, the site owner.** James is the only "user" of this journey: he is
the one who needs to know whether the portfolio is doing its job. The
recruiter / peer / client persona from [JNY-001](JNY-001-portfolio-revamp-iteration-1.md)
is unchanged — they do not interact with analytics; they are merely measured.
James needs to answer questions like *"did anyone actually visit after I
sent that email?"*, *"is the live signal worth the engineering cost?"*,
*"is mobile or desktop the dominant device?"* without standing up his own
tracking pipeline.

## Trigger

Iteration 1 of the revamp shipped with **no analytics** (a deliberate
exclusion in [JNY-001 §Out of scope](JNY-001-portfolio-revamp-iteration-1.md)).
Now that the site is live at `jameslanzon.com` and being shared with
recruiters, James has zero visibility into traffic, referrers, device mix,
or which sections people actually reach. He had Google Analytics on the
legacy 2016–2018 site and on client work (e.g. the European Commission
DG-EAC service pages) and wants the same observability back — minus the
historical privacy-hostile defaults.

## Goal

The site owner can, without leaving Google Analytics, see **how many
people visit the portfolio, where they came from, what device they used,
and which sections they engaged with** — while every visitor still gets a
fast, accessible, JS-optional page and a clear, lawful choice about being
tracked. The recruiter persona must not feel any regression in load time
or trust.

## Journey steps

### Visitor (the measured party)

1. Visitor lands on `jameslanzon.com` from a recruiter link, LinkedIn, or
   email signature.
2. Before any analytics script loads, the visitor sees a small, unobtrusive
   consent prompt explaining that James would like to use Google Analytics
   to understand traffic, with clear "Accept" and "Decline" actions of
   equal visual weight.
3. The visitor chooses. Their choice is remembered across visits and can
   be changed later from a persistent footer link ("Cookie preferences").
4. If they decline (or never choose), no analytics or advertising cookies
   are set and no requests are sent to Google. The page behaves exactly as
   it did in iteration 1.
5. If they accept, the analytics script loads after the page is interactive
   and does not block any content, fonts, or images. They never see a
   layout shift or perceptible slowdown.

### Site owner (James)

1. James opens the Google Analytics property for `jameslanzon.com` and
   sees daily/weekly visitor counts, top referrers, country, device
   category, and most-viewed sections.
2. He can tell whether a specific outreach (a link in an email, a LinkedIn
   post) produced visits, by reading referrer / UTM parameters.
3. He can see which scroll milestones (hero, experience, contact) people
   reach, so he knows whether the timeline is being read or skipped.
4. He can compare consenting vs declined traffic only in aggregate
   (consent-rate metric) — never per-visitor identifiers.

## Success criteria

- [ ] No Google Analytics script, cookie, or network request occurs before
      the visitor has actively consented. Verifiable via DevTools Network
      and Application panels on a fresh profile.
- [ ] The consent prompt is keyboard-reachable, screen-reader-announced,
      and passes WCAG 2.2 AA contrast and focus-visible checks.
- [ ] "Accept" and "Decline" are presented as equal-weight choices (same
      size, same prominence, no dark patterns).
- [ ] Declining or dismissing the prompt persists across reloads and
      across page navigations within the site.
- [ ] A persistent "Cookie preferences" link in the footer reopens the
      prompt and lets the visitor change their mind in either direction.
- [ ] When the visitor declines, the page passes the same Lighthouse
      performance budget as iteration 1 (TTI < 2 s on simulated 4G).
- [ ] When the visitor accepts, the analytics script is loaded
      asynchronously and contributes < 100 ms to TTI on simulated 4G.
- [ ] The page remains fully readable and functional with JavaScript
      disabled — the consent prompt simply does not appear and no analytics
      runs (parity with iteration 1's static-output guarantee).
- [ ] In Google Analytics, James can see at minimum: page views, sessions,
      referrer, country, device category, and a custom event for each
      section the visitor scrolls into view.
- [ ] No personally identifiable information (full IP, user-agent string
      verbatim, query strings containing email addresses) is sent to
      Google. IP anonymisation / "Google signals" off by default.
- [ ] The site owner can disable analytics globally by changing one
      configuration value (e.g. an env var or `app.config.ts` toggle) and
      redeploying — no consent prompt or network call appears thereafter.

## Failure modes

- The consent prompt blocks the hero on mobile, hiding James' name and
  role and undoing the iteration-1 "first viewport" promise.
- Analytics fires before consent (a common copy-paste GA snippet bug),
  exposing James to GDPR / ePrivacy complaints and contradicting the
  prompt itself.
- The script slows the page to the point that the recruiter bounces
  before the experience timeline is reachable.
- A measurement ID is hard-coded in the repository and someone forks the
  site, polluting James' analytics with their traffic.
- Analytics events for "section viewed" fire so aggressively (every
  scroll pixel) that they distort the data and inflate Google's quotas.
- The footer "Cookie preferences" link is missing or broken on the
  generated static output, so a visitor who declined cannot opt back in
  — a regulatory issue and a usability one.
- The consent record is stored in a way that resets on every visit
  (e.g. `sessionStorage` instead of `localStorage`), nagging the visitor
  on every return — a known abandonment driver.

## Out of scope

- Server-side analytics, self-hosted analytics (Plausible, Umami, etc.).
  This journey is specifically about **Google Analytics 4** to match
  James' existing tooling and dashboards.
- Advertising cookies, remarketing, Google Ads conversion tags.
- A/B testing, heatmaps, session recording.
- Any analytics for the legacy `website/` and `docs/legacy/` directories —
  those remain reference-only (per [AGENTS.md §2](../../AGENTS.md#2-project-structure)).
- Backfilling pre-revamp historical data.

## Open questions

- Does James want a single GA4 property for `jameslanzon.com` only, or a
  shared property across personal projects?
- Should the consent prompt be a banner, a modal, or an inline
  disclosure? The journey is agnostic — the spec author should decide
  based on the iteration-1 visual language and the WCAG criteria above.
- Does James want the measurement ID committed to the repo (public —
  acceptable for GA4 since the ID alone confers no write access) or
  injected at build time via a GitHub Actions secret?
- Should the "section viewed" events use Intersection Observer with a
  one-time fire per section per session, or a debounced scroll handler?
  The spec must pick one and justify it on performance grounds.
- Does declining propagate to a `Sec-GPC` / `DNT` respectful default for
  return visitors, so they never see the prompt again?
