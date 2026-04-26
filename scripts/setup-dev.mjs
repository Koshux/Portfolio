// scripts/setup-dev.mjs
//
// One-shot helper for fresh clones: applies skip-worktree to
// content/live-signal.json so post-build writes don't appear in
// `git status` and never get committed back.
//
// Idempotent. Safe to run multiple times. Bails politely if the
// directory is not a git checkout.

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const TARGET = 'content/live-signal.json'

function log(message) {
  console.log(`[setup-dev] ${message}`)
}

function isGitRepo() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' })
    return true
  }
  catch {
    return false
  }
}

function isAlreadySkipped() {
  try {
    const out = execSync(`git ls-files -v -- "${TARGET}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    // Lower-case prefix means a skip-worktree / assume-unchanged flag is set.
    return /^[a-z]/.test(out)
  }
  catch {
    return false
  }
}

function main() {
  if (!isGitRepo()) {
    log('not a git checkout — skipping (no-op)')
    return
  }
  if (!existsSync(resolve(process.cwd(), TARGET))) {
    log(`${TARGET} not found — skipping. Run \`npm run pregenerate\` first.`)
    return
  }
  if (isAlreadySkipped()) {
    log(`${TARGET} already has skip-worktree applied — nothing to do.`)
    return
  }
  try {
    execSync(`git update-index --skip-worktree -- "${TARGET}"`, { stdio: 'ignore' })
    log(`applied skip-worktree to ${TARGET}.`)
    log('Local builds will now overwrite this file without polluting git status.')
  }
  catch (err) {
    log(`failed to apply skip-worktree: ${err?.message ?? 'unknown'}`)
  }
}

main()
