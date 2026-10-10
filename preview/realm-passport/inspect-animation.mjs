import { startPassportBrowser, pause } from './browser-qa.mjs'

const browser = await startPassportBrowser()
try {
  for (const width of [360, 1280]) {
    await browser.navigate(`count=12&member=animation-${width}`, width)
    await browser.click('.rp-cover')
    await browser.waitFor('document.querySelector(".rp-book").getAttribute("aria-busy") === "false"')
    await browser.click('.rp-navigation > button:last-child')
    await browser.waitFor('document.querySelector(".rp-book").getAttribute("aria-busy") === "false"')
    await pause(450)
    await browser.evaluate('document.querySelector(".rp-book").scrollIntoView({block:"center"})')
    await pause(700)
    const box = await browser.evaluate('(() => { const r=document.querySelector(".rp-book").getBoundingClientRect(); return {x:r.x+r.width*.85,y:r.y+r.height*.5,width:r.width}; })()')
    const pageWidth = box.width / (width >= 900 ? 2 : 1)
    await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y })
    await browser.send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, x: box.x, y: box.y })
    for (const progress of [.2, .5, .8]) {
      await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', button: 'left', buttons: 1, x: box.x-pageWidth*progress, y: box.y })
      await pause(80)
      console.log('STATE', await browser.evaluate('({busy:document.querySelector(".rp-book").getAttribute("aria-busy"), leaf:document.querySelector(".rp-paper-strip-root")?.style.transform})'))
      console.log('FRAME', await browser.screenshot(`turn-${width}-${progress}.png`, true))
    }
    await browser.send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, x: box.x-pageWidth*.8, y: box.y })
    await browser.waitFor('document.querySelector(".rp-book").getAttribute("aria-busy") === "false"')
    console.log('SETTLED', await browser.screenshot(`turn-${width}-settled.png`))
  }
} finally { await browser.close() }
