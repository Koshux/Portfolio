---
id: JNY-001
title: "Revamped portfolio — iteration 1"
status: approved
created: 2026-04-26
owner: "James Lanzon"
related-specs: [SPEC-001]
---

# JNY-001 — Revamped portfolio, iteration 1

## Persona

**Mixed audience, optimised for the recruiter.** The primary visitor is a
recruiter or hiring manager evaluating James for a senior UX architect /
full-stack role; the secondary visitor is an engineering peer or prospective
consulting client who arrived from the same link. They have between thirty
seconds and three minutes, are not committed to scrolling, and may be on any
device. They have heard of James through a CV, a LinkedIn profile, an email
signature, a Google search after meeting him, or a link from a talk or article
— the page must work the same regardless of which door they came through.

## Trigger

The visitor has just clicked a link to `jameslanzon.com` because they want to
verify, in their own time, that James is who he claims to be. They are not
browsing for fun; they are validating a decision they are about to make
(invite to interview, accept a meeting, forward to a colleague, hire for a
project).

## Goal

The visitor leaves with **a clear sense of who James is, a lasting positive
impression of his level and breadth, and the obvious next step to contact
him.** Specifically: they can name his current role, recognise the depth of
his experience, and they know exactly how to reach out without hunting.

## Journey steps

1. The visitor lands on the homepage from an external link.
2. Within the first viewport they see who James is, what he does, and his
   current role at a glance. They notice a small "live signal" in the page
   header (latest commit timestamp from any of James' public repositories,
   plus the current time in Malta) that telegraphs "this is a real, active
   engineer".
3. They scan a short overview that tells them, in James' voice, what he
   stands for professionally.
4. They scroll through a chronological experience timeline and recognise the
   organisations and the seniority of the roles.
5. They glance at a skills / expertise area and confirm the technologies and
   disciplines match what they were looking for.
6. They decide they want to make contact. They reach for the persistent
   header (email icon for direct outreach, GitHub icon to inspect James'
   public work) or scroll to the contact section. The contact section
   confirms the email and notes the CV is available on request.
7. They close the tab with a clear, positive impression and an actionable
   way to follow up.

## Success criteria

- [ ] Visitor can identify James' current role and seniority within the first
      viewport on both mobile and desktop, without scrolling.
- [ ] Visitor can find an email or primary contact link within 10 seconds of
      landing, on any page section (persistent header email icon).
- [ ] Visitor can reach James' GitHub profile in one click from the header on
      any page section.
- [ ] Visitor sees a live signal in the header showing the timestamp of
      James' most recent public commit (across any of his repositories) and
      the current time in Malta. The commit timestamp is correct as of the
      most recent deploy; the Malta time updates live when JavaScript is
      enabled and falls back to a static "Malta · CEST" label otherwise.
- [ ] Visitor can scan the full experience history on a single page without
      navigating away or opening modals.
- [ ] Page is interactive in under 2 seconds on a simulated 4G mobile
      connection.
- [ ] Page passes WCAG 2.2 AA automated accessibility checks (axe / Lighthouse).
- [ ] Page content is fully readable with JavaScript disabled (static HTML
      output from `nuxt generate`), including the latest-commit chip.
- [ ] Page works equivalently on mobile and desktop viewports — no
      mobile-only or desktop-only content.

## Failure modes

- The hero is generic ("Hi, I'm James") and the visitor cannot tell, in five
  seconds, what level he operates at — they bounce.
- Contact details are buried at the bottom and the visitor on mobile gives
  up scrolling before reaching them.
- The experience section is a wall of text rather than a scannable timeline —
  the recruiter skims and misses the senior roles.
- The CV link is broken or out of date, undermining trust. *(mitigated:
  CV download removed in iteration 1; see Resolved decisions.)*
- The live signal in the header is wrong, stale by months, or fails to load —
  it actively undermines the "active engineer" message it is meant to send.
- The GitHub link points to the wrong profile or 404s.
- The page renders blank or shifts layout on mobile while fonts/images load,
  giving the impression of an unpolished engineer.
- Accessibility regressions (low contrast, missing landmarks, unlabelled
  links) make the page feel unprofessional to an accessibility-aware peer —
  particularly damaging given James' stated expertise.

## Out of scope

- Blog or writing section, and any CMS / authoring tooling for it.
- Selected projects / case studies (deferred to iteration 2).
- Testimonials (none collected yet — deferred).
- Internationalisation / translated content.
- A contact form — a `mailto:` link is sufficient for iteration 1.
- A downloadable CV — the contact area instead notes the CV is available
  on request. The legacy `docs/cv/cv.md` remains an internal source
  document only.
- Dark/light theme toggle, analytics, or tracking.
- Animations beyond simple, taste-level transitions.
- Live-fetched data at the visitor's runtime — the latest-commit chip is
  resolved at build time only.

## Resolved decisions

- **Primary contact email:** `lanzonprojects@gmail.com`. The Gmail address
  in `docs/cv/cv.md` is superseded for public-facing contact.
- **CV download:** removed. The contact area shows a single "CV available
  on request" line. `docs/cv/cv.md` remains the source-of-truth document
  used to populate `content/cv.md` but is not exposed publicly.
- **Header right-cluster:** live-signal chip (latest public commit + Malta
  time) + GitHub icon link + email icon link, in that order.
- **GitHub icon:** primary header CTA alongside email. LinkedIn moves to
  the contact section / footer as a secondary link.
- **Live-signal source:** GitHub REST API
  (`/users/jameslanzon/events/public`) is queried at **build time** by a
  pre-`nuxt generate` script. The latest commit timestamp + repo name is
  injected into the static HTML. No runtime API calls from the visitor's
  browser.
- **Malta time:** server-renders a static label (`"Malta · CEST"` or the
  current offset) and is progressively enhanced into a live ticking clock
  when JavaScript is available.
- **Hero portrait:** no portrait photo of James in iteration 1.
