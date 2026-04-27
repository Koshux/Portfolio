import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve, relative } from 'node:path'

const ROOT = process.cwd()
const PUBLIC = resolve(ROOT, '.output/public')

describe('generated /CNAME', () => {
  it('exists in .output/public', () => {
    expect(existsSync(resolve(PUBLIC, 'CNAME'))).toBe(true)
  })

  it('contains exactly the apex domain jameslanzon.com', () => {
    const contents = readFileSync(resolve(PUBLIC, 'CNAME'), 'utf8').trim()
    expect(contents).toBe('jameslanzon.com')
  })

  it('emits a .nojekyll safety net at the public root', () => {
    expect(existsSync(resolve(PUBLIC, '.nojekyll'))).toBe(true)
  })
})

// SPEC-003 AC-14 — mixed-content guard. Once HTTPS is enforced on the
// live origin (see SPEC-003 + the runbook) any `http://jameslanzon.com`
// or `http://www.jameslanzon.com` literal in source becomes a foot-gun:
// either it 301-redirects (wasted hop, breaks `target=_blank` UX) or it
// triggers a mixed-content warning when embedded in an https page.
//
// We scan only the source surfaces — `app/`, `content/`, `public/` —
// and not `.output/`, `node_modules/`, or anything generated. Tests
// and docs (`tests/`, `docs/`) intentionally CAN reference the http
// form to document/assert the redirect behaviour.
describe('SPEC-003 AC-14 — no http://jameslanzon.com literals in source', () => {
  const SOURCE_DIRS = ['app', 'content', 'public'] as const

  // Match http:// at a word boundary so https:// does not match. Also
  // case-insensitive — `HTTP://` would be just as broken.
  const FORBIDDEN_PATTERN = /\bhttp:\/\/(www\.)?jameslanzon\.com/i

  // File extensions to scan. Skip binary / image / font assets so we
  // don't false-positive on a coincidental byte sequence in a PNG.
  const TEXT_EXTENSIONS = new Set([
    '.vue',
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mjs',
    '.cjs',
    '.json',
    '.md',
    '.mdc',
    '.html',
    '.htm',
    '.css',
    '.scss',
    '.txt',
    '.xml',
    '.yml',
    '.yaml',
    '.webmanifest',
  ])

  function* walkText(dir: string): Generator<string> {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name)
      if (entry.isDirectory()) {
        yield* walkText(full)
      } else if (entry.isFile()) {
        const lower = entry.name.toLowerCase()
        const dot = lower.lastIndexOf('.')
        const ext = dot >= 0 ? lower.slice(dot) : ''
        if (TEXT_EXTENSIONS.has(ext)) {
          yield full
        }
      }
    }
  }

  it('app/, content/, and public/ contain no http://jameslanzon.com literals', () => {
    const offenders: { file: string; line: number; text: string }[] = []
    for (const top of SOURCE_DIRS) {
      const root = resolve(ROOT, top)
      if (!existsSync(root) || !statSync(root).isDirectory()) continue
      for (const file of walkText(root)) {
        const contents = readFileSync(file, 'utf8')
        if (!FORBIDDEN_PATTERN.test(contents)) continue
        const lines = contents.split(/\r?\n/)
        lines.forEach((line, i) => {
          if (FORBIDDEN_PATTERN.test(line)) {
            offenders.push({
              file: relative(ROOT, file),
              line: i + 1,
              text: line.trim().slice(0, 200),
            })
          }
        })
      }
    }
    expect(
      offenders,
      `Found http://jameslanzon.com literals in source (SPEC-003 AC-14):\n${offenders
        .map((o) => `  ${o.file}:${o.line} → ${o.text}`)
        .join('\n')}`,
    ).toEqual([])
  })
})
