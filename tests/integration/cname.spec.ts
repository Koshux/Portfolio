import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PUBLIC = resolve(process.cwd(), '.output/public')

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
