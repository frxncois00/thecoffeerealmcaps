import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { getFontEmbedCSS, toPng } from 'html-to-image'
import PptxGenJS from 'pptxgenjs'
import Cover from './Cover'
import PassportPaper from './PassportPaper'

// Render a fixed-size snapshot separately from the interactive page-turn book.
// Exporting never turns pages or marks a customer's stamps as seen.
export async function exportPassport(presentation) {
  const host = document.createElement('div')
  host.className = 'realm-scene rp-export-host'
  host.setAttribute('aria-hidden', 'true')
  host.inert = true
  document.body.append(host)
  const root = createRoot(host)
  try {
    flushSync(() => root.render(<>
      <div className="rp-export-page rp-export-back"><span>THE COFFEE REALM</span><strong>Realm Passport</strong><span>Member’s edition</span></div>
      <div className="rp-export-page rp-export-front"><Cover interactive={false} /></div>
      {presentation.pages.map((page, index) => <div key={index} className={`rp-export-page ${index % 2 ? 'rp-right' : 'rp-left'}`}>
        <PassportPaper index={index} page={page} presentation={presentation} active={false} loading={false} seen={{}} />
      </div>)}
    </>))
    await document.fonts.ready
    await Promise.all(Array.from(host.querySelectorAll('img'), img => img.decode().catch(() => {
      // MemberPhoto supplies its usual placeholder when an avatar cannot load.
      if (!img.closest('.rp-photo')) throw new Error('Passport artwork could not load. Please try again.')
    })))
    const fontEmbedCSS = await getFontEmbedCSS(host)
    const pptx = new PptxGenJS()
    // Each half uses the same proportions as an existing inside page.
    pptx.defineLayout({ name: 'PASSPORT', width: 10, height: 10 * 448 / 772 })
    pptx.layout = 'PASSPORT'
    pptx.author = 'The Coffee Realm'
    pptx.title = 'Realm Passport'
    pptx.subject = 'A saved copy of your Realm Passport'
    const pages = Array.from(host.children)
    for (let index = 0; index < pages.length; index += 2) {
      const slide = pptx.addSlide()
      slide.background = { color: index === 0 ? '214A38' : 'F8F2DE' }
      for (let side = 0; side < 2 && index + side < pages.length; side++) {
        const data = await toPng(pages[index + side], { pixelRatio: 3, fontEmbedCSS })
        slide.addImage({ data, x: side * 5, y: 0, w: 5, h: 10 * 448 / 772 })
      }
    }
    await pptx.writeFile({ fileName: `Realm-Passport-${presentation.identity.id.replace(/[^a-zA-Z0-9-]/g, '')}.pptx` })
  } finally {
    root.unmount()
    host.remove()
  }
}
