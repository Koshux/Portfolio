import { describe, it, expect } from 'vitest'
import { sortRoles } from '../../../app/utils/sortRoles'
import type { Role } from '../../../app/types/cv'

function role(partial: Partial<Role> & { start: string }): Role {
  return {
    title: 't',
    organisation: 'o',
    end: null,
    bullets: ['b'],
    ...partial,
  }
}

describe('sortRoles', () => {
  it('returns an empty array unchanged', () => {
    expect(sortRoles([])).toEqual([])
  })

  it('returns a single-item array unchanged', () => {
    const r = role({ start: '2024-03' })
    expect(sortRoles([r])).toEqual([r])
  })

  it('sorts year-month inputs reverse-chronologically', () => {
    const a = role({ start: '2020-06', title: 'a' })
    const b = role({ start: '2023-01', title: 'b' })
    const c = role({ start: '2025-09', title: 'c' })
    expect(sortRoles([a, c, b]).map(r => r.title)).toEqual(['c', 'b', 'a'])
  })

  it('sorts year-only inputs reverse-chronologically', () => {
    const a = role({ start: '2018', title: 'a' })
    const b = role({ start: '2021', title: 'b' })
    const c = role({ start: '2024', title: 'c' })
    expect(sortRoles([b, a, c]).map(r => r.title)).toEqual(['c', 'b', 'a'])
  })

  it('normalises year-only to YYYY-01 so it sorts before YYYY-06 in the same year', () => {
    const yearOnly = role({ start: '2025', title: 'year-only' })
    const yearJune = role({ start: '2025-06', title: 'mid-year' })
    // June 2025 is more recent than Jan 2025, so it should come first
    expect(sortRoles([yearOnly, yearJune]).map(r => r.title)).toEqual(['mid-year', 'year-only'])
  })

  it('handles a mix of year-only and year-month inputs', () => {
    const roles = [
      role({ start: '2016', title: 'r1' }),
      role({ start: '2023-01', title: 'r2' }),
      role({ start: '2025-01', title: 'r3' }),
      role({ start: '2025', title: 'r4' }),
      role({ start: '2021-11', title: 'r5' }),
    ]
    // r3 (2025-01) and r4 (2025 → 2025-01) are equal; r3 came first → preserved
    expect(sortRoles(roles).map(r => r.title)).toEqual(['r3', 'r4', 'r2', 'r5', 'r1'])
  })

  it('is stable for equal starts (preserves input order)', () => {
    const a = role({ start: '2024-01', title: 'first' })
    const b = role({ start: '2024-01', title: 'second' })
    const c = role({ start: '2024-01', title: 'third' })
    expect(sortRoles([a, b, c]).map(r => r.title)).toEqual(['first', 'second', 'third'])
  })

  it('does not mutate the input array', () => {
    const input = [role({ start: '2020' }), role({ start: '2024' })]
    const before = [...input]
    sortRoles(input)
    expect(input).toEqual(before)
  })
})
