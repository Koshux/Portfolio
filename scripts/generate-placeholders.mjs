// scripts/generate-placeholders.mjs
//
// One-shot script to (re-)generate the favicon PNG variants and the OG
// image from SVG sources, using @resvg/resvg-js.
//
// Run manually: `node scripts/generate-placeholders.mjs`. The output files
// are committed; this script is not on a build hook.

import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { Resvg } from '@resvg/resvg-js'

const root = process.cwd()
const PUBLIC = resolve(root, 'public')

const FAVICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0b1020"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
    font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    font-weight="700" font-size="30" fill="#22d3ee" letter-spacing="-1">JL</text>
</svg>
`

const OG_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0b1020"/>
  <text x="80" y="300"
    font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    font-weight="700" font-size="84" fill="#ffffff">James Lanzon</text>
  <text x="80" y="380"
    font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    font-weight="500" font-size="40" fill="#22d3ee">UX Architect &amp; Accessibility Expert</text>
  <text x="80" y="450"
    font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    font-weight="400" font-size="28" fill="#cbd5e1">European Commission · Malta</text>
</svg>
`

function render(svg, width, outPath) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } })
  const png = resvg.render().asPng()
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, png)
  console.log(`wrote ${outPath} (${png.byteLength} bytes)`)
}

render(FAVICON_SVG, 16, resolve(PUBLIC, 'favicon-16.png'))
render(FAVICON_SVG, 32, resolve(PUBLIC, 'favicon-32.png'))
render(FAVICON_SVG, 192, resolve(PUBLIC, 'favicon-192.png'))
render(FAVICON_SVG, 512, resolve(PUBLIC, 'favicon-512.png'))
render(FAVICON_SVG, 180, resolve(PUBLIC, 'apple-touch-icon.png'))
render(OG_SVG, 1200, resolve(PUBLIC, 'og', 'og-image.png'))
