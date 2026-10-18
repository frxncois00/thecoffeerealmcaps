import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createFrameBudget } from './frameBudget.js'
import { initialQuality, lowerQuality } from './performance.js'
import { products, flavors, cakeSlices, pastaDishes, galleryPhotos, environment } from './products.js'
import sharp from 'sharp'
import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'

// Regression: bundlers permit unbound JSX names (e.g. a missing Coffee import),
// which then crash React before the page can display anything.
test('all tour JSX component names resolve to a declared binding', () => {
  const traverse = traverseModule.default || traverseModule
  for (const file of ['RealmProductTour.jsx', 'TourChapters.jsx', 'TourImage.jsx', 'main.jsx']) {
    const ast = parse(readFileSync(new URL(file, import.meta.url), 'utf8'), { sourceType: 'module', plugins: ['jsx'] })
    traverse(ast, {
      JSXOpeningElement(path) {
        let name = path.node.name
        while (name.type === 'JSXMemberExpression') name = name.object
        if (name.type === 'JSXIdentifier' && (/^[A-Z]/.test(name.name) || path.node.name.type === 'JSXMemberExpression')) {
          assert(path.scope.hasBinding(name.name), `${file}: missing component import or declaration for ${name.name}`)
        }
      },
    })
  }
})

test('capability hints are conservative without requiring Android-only memory APIs', () => {
  assert.equal(initialQuality({ mobile: true, cores: 8 }), 'medium')
  assert.equal(initialQuality({ mobile: false, cores: 4, memory: 8 }), 'medium')
  assert.equal(initialQuality({ cores: 8, memory: 2 }), 'low')
  assert.equal(initialQuality({ cores: 8, memory: 8, mobile: false }), 'high')
  assert.equal(lowerQuality(lowerQuality(lowerQuality('high'))), 'low')
})

function simulate(monitor, from, duration, interval) {
  for (let time = from; time <= from + duration; time += interval) monitor.sample(time)
}
test('60fps and one slow window do not downgrade; sustained 30fps does', () => {
  let drops = 0
  const monitor = createFrameBudget(() => drops++)
  simulate(monitor, 0, 8000, 1000 / 60)
  assert.equal(drops, 0)
  monitor.reset()
  simulate(monitor, 10000, 2100, 1000 / 30)
  assert.equal(drops, 0)
  simulate(monitor, 12134, 2400, 1000 / 30)
  assert.equal(drops, 1)
  simulate(monitor, 14600, 5000, 1000 / 30)
  assert.equal(drops, 1, 'cooldown prevents cascading drops')
})
test('background-tab time is excluded from the next FPS sample', () => {
  let drops = 0
  const monitor = createFrameBudget(() => drops++)
  simulate(monitor, 0, 2200, 1000 / 30)
  monitor.reset()
  simulate(monitor, 120000, 8000, 1000 / 60)
  assert.equal(drops, 0)
})
test('every tour artwork has responsive WebP variants preserving aspect ratio and transparency', async () => {
  const manifest = JSON.parse(readFileSync(new URL('./image-manifest.json', import.meta.url)))
  const files = [...products.map(p => p.image), ...flavors.flatMap(f => [f.cup, f.bubble]), ...cakeSlices.map(c => c.file), ...pastaDishes.map(p => p.file), ...galleryPhotos.map(p => p.file), ...Object.values(environment)]
  for (const file of files) {
    const image = manifest[file.split('/').pop()]
    assert(image, file)
    assert(image.width > 0 && image.height > 0)
    assert(image.variants.some(v => v.width <= 960))
    const source = await sharp(readFileSync(new URL(`../../public/images/realm-tour/${file.split('/').pop()}`, import.meta.url))).metadata()
    for (const variant of image.variants) {
      assert(variant.src.endsWith('.webp'))
      assert(existsSync(new URL(`../../public${variant.src}`, import.meta.url)), variant.src)
      const metadata = await sharp(readFileSync(new URL(`../../public${variant.src}`, import.meta.url))).metadata()
      assert.equal(metadata.width, variant.width)
      assert(Math.abs(metadata.height - image.height * metadata.width / image.width) <= 1)
      if (source.hasAlpha) assert(metadata.hasAlpha, `${variant.src} lost transparency`)
    }
  }
})
