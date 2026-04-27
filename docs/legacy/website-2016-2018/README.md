# Legacy site — `website/` (2016 – 2018)

> **Frozen historical artefact.** Do not extend, do not serve, do not
> import from. Retained for posterity only.

This directory is the static portfolio that lived at `jameslanzon.com`
between roughly 2016 and 2018 (raw HTML/CSS/JS, hand-rolled scrolling
nav, no framework). It was relocated here from the repository root
during the iteration-1 cleanup described in
[JNY-001](../../journeys/JNY-001-portfolio-revamp-iteration-1.md) and
[SPEC-001](../../specs/SPEC-001-portfolio-revamp-iteration-1.md) (task
T2 / repo cleanup).

## Why it is kept

- Reference for past visual / copy decisions.
- Sentimental + audit trail.

## Why it is not extended

The current site is a Nuxt 4 SSG build under `app/` and `content/`.
All new work belongs there. Adding to this directory would diverge
from the active production code and silently rot.

## Why it is not served

`nuxt generate` produces `.output/public/` from `app/` and `public/`
only. Nothing in `docs/legacy/` is copied into the deployed artefact.

If a piece of copy or imagery from this site is still useful, port
it into `content/cv.md` (or another `content/` document) — do not
re-link the legacy file.
