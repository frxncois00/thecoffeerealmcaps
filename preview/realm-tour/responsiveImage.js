import manifest from './image-manifest.json'

// PERF: caps decoded textures by tier, while sizes lets the browser choose the
// appropriate DPR candidate. Missing entries fail safely to the original URL.
export function responsiveImage(src, tier = 'medium', sizes = '100vw') {
  const entry = manifest[src.split('/').pop()]
  if (!entry) return { src }
  const cap = tier === 'high' ? 1920 : tier === 'medium' ? 1200 : 960
  const variants = entry.variants.filter(v => v.width <= cap)
  const fallback = variants.at(-1) || entry.variants[0]
  return { src: fallback.src, srcSet: variants.map(v => `${v.src} ${v.width}w`).join(', '), sizes }
}
