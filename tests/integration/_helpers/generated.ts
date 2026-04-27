// tests/integration/_helpers/generated.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export const PUBLIC_DIR = resolve(process.cwd(), '.output/public')

export function readGeneratedHtml(file = 'index.html'): string {
  return readFileSync(resolve(PUBLIC_DIR, file), 'utf8')
}
