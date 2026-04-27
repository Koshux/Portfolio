import type { Role } from '../types/cv'

/**
 * Normalise a role's `start` value to `YYYY-MM` for comparison.
 * Year-only strings (`YYYY`) become `YYYY-01` so they sort earlier than
 * any `YYYY-MM` value in the same year.
 */
function normaliseStart(start: string): string {
  return /^\d{4}$/.test(start) ? `${start}-01` : start
}

/**
 * Sort roles in descending (reverse-chronological) order by `start`.
 *
 * - Year-only `start` values are normalised to `${year}-01` for comparison.
 * - Stable: roles with equal normalised starts preserve their input order
 *   (modern `Array.prototype.sort` is required to be stable).
 * - Pure: returns a new array; does not mutate the input.
 */
export function sortRoles<T extends Pick<Role, 'start'>>(roles: T[]): T[] {
  return roles
    .map((role, index) => ({ role, index, key: normaliseStart(role.start) }))
    .sort((a, b) => {
      if (a.key === b.key) return a.index - b.index
      return a.key < b.key ? 1 : -1
    })
    .map(({ role }) => role)
}

export type { Role } from '../types/cv'
