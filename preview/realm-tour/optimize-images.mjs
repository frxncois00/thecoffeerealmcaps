// PERF: reproducible responsive assets. Originals remain available to the main
// site; the tour loads only these compressed derivatives, preserving transparency.
import sharp from 'sharp'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { products, flavors, cakeSlices, pastaDishes, galleryPhotos, environment } from './products.js'

const source = fileURLToPath(new URL('../../public/images/realm-tour/', import.meta.url))
const output = `${source}optimized/`
await mkdir(output, { recursive: true })
const groups = new Map()
const add = (name, sizes) => groups.set(name.split('/').pop(), sizes)
products.forEach(p => add(p.image, [320, 640, 960, 1200]))
flavors.forEach(f => { add(f.cup, [320, 640, 960, 1200]); add(f.bubble, [160, 320, 480]) })
cakeSlices.forEach(c => add(c.file, [160, 320, 480]))
pastaDishes.forEach(p => add(p.file, [320, 640, 960, 1200]))
galleryPhotos.forEach(p => add(p.file, [320, 640, 960]))
Object.values(environment).forEach(p => add(p, [640, 960, 1200, 1600, 1920]))
const manifest = {}
let originalBytes = 0, largestBytes = 0
// Sequential encoding keeps build-time memory bounded on developer laptops too.
for (const [file, widths] of groups) {
  const input = `${source}${file}`
  const meta = await sharp(input).metadata()
  const variants = []
  for (const width of [...new Set(widths.map(w => Math.min(w, meta.width)))]) {
    const name = `${file.replace(/\.[^.]+$/, '')}-${width}.webp`
    const result = await sharp(input).rotate().resize({ width, withoutEnlargement: true })
      .webp({ quality: 86, alphaQuality: 95, effort: 5 }).toFile(`${output}${name}`)
    variants.push({ width: result.width, src: `/images/realm-tour/optimized/${name}`, bytes: result.size })
  }
  manifest[file] = { width: meta.width, height: meta.height, variants }
  originalBytes += (await stat(input)).size
  largestBytes += variants.at(-1).bytes
}
await writeFile(new URL('./image-manifest.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify({ images: groups.size, originalBytes, largestBytes, reduction: `${(100 * (1 - largestBytes / originalBytes)).toFixed(1)}%` }))
