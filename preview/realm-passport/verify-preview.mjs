import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { startPassportBrowser, pause } from './browser-qa.mjs'

const browser = await startPassportBrowser()
const results = []
const screenshots = []
const failures = []
const mode = process.argv[2] || 'all'
const selector = '.rp-navigation > button:last-child'
const settled = async () => {
  await pause(30)
  await browser.waitFor('document.querySelector(".rp-book")?.getAttribute("aria-busy") === "false"')
  await browser.waitFor('Array.from(document.images).every(image => image.complete && image.naturalWidth > 0)', 15000)
  await pause(35)
}
const click = async target => { await browser.click(target); await settled() }
const capture = async name => { const path = await browser.screenshot(name); screenshots.push(path); return path }
const paperState = () => browser.evaluate(`(() => ({
  overflow: document.documentElement.scrollWidth > innerWidth,
  indicator: document.querySelector('.rp-page-indicator').innerText,
  pages: Array.from(document.querySelectorAll('.rp-paper')).map(paper => ({
    index: Number(paper.dataset.pageIndex),
    clipped: paper.scrollHeight > paper.clientHeight + 1,
    height: paper.clientHeight, scrollHeight: paper.scrollHeight,
    stamps: Array.from(paper.querySelectorAll('.rp-stamp-slot[data-order-id]')).map(stamp => ({ id: stamp.dataset.orderId, art: stamp.querySelector('img')?.getAttribute('src'), label: stamp.querySelector('button')?.getAttribute('aria-label') })),
    slots: paper.querySelectorAll('.rp-stamp-slot').length,
  })),
  nextDisabled: document.querySelector('.rp-navigation > button:last-child').disabled,
}))()`)
const key = async value => {
  await browser.evaluate('document.querySelector(".rp-book").focus({preventScroll:true})')
  await browser.send('Input.dispatchKeyEvent', { type: 'keyDown', key: value })
  await browser.send('Input.dispatchKeyEvent', { type: 'keyUp', key: value })
  await settled()
}

async function matrix() {
  const widths = mode === 'smoke' ? [360, 1280] : [360, 768, 1280]
  const counts = mode === 'smoke' ? [3] : [0, 3, 5, 12, 53]
  const motions = mode === 'smoke' ? [false] : [false, true]
  for (const reduced of motions) for (const width of widths) for (const count of counts) {
    const name = `${width}-${count}-${reduced ? 'reduced' : 'normal'}`
    try {
      await browser.navigate(`count=${count}&member=matrix-${name}`, width, reduced)
      assert.equal(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'Cover horizontal overflow')
      assert.equal(await browser.evaluate('document.querySelector(".rp-navigation > button:first-child").disabled'), true)
      await click('.rp-cover')
      if (count === 3 && !reduced) console.log('SCREENSHOT', await capture(`${name}-identity.png`))
      const allStamps = []
      const clipping = []
      let step = 0
      while (step++ < 13) {
        const state = await paperState()
        assert.equal(state.overflow, false, 'Horizontal overflow')
        for (const paper of state.pages) {
          if (paper.clipped) clipping.push({ index: paper.index, height: paper.height, scrollHeight: paper.scrollHeight })
          if (paper.index > 0 && paper.index < 11) assert.equal(paper.slots, 5)
          for (const stamp of paper.stamps) {
            assert.match(stamp.art, /\/images\/realm-passport\/stamp-\d\d-/)
            assert.match(stamp.label, /Stamp [1-5] of 5, earned, order TCR-\d+, order placed/)
            allStamps.push(stamp.id)
          }
        }
        if (count === 3 && !reduced && state.pages.some(paper => paper.index === 1)) console.log('SCREENSHOT', await capture(`${name}-stamps.png`))
        if (state.nextDisabled) break
        await click(selector)
      }
      assert.equal(new Set(allStamps).size, Math.min(count, 50), 'All order stamps remain unique')
      assert.equal(allStamps.length, Math.min(count, 50), 'No duplicate order stamp rendered across pages')
      const totals = await browser.evaluate('Array.from(document.querySelectorAll(".rp-journey-counts dd")).map(element => Number(element.textContent))')
      assert.deepEqual(totals, [count, Math.min(10, Math.floor(count / 5))])
      if (count === 53 && !reduced) console.log('SCREENSHOT', await capture(`${name}-summary.png`))
      if (clipping.length) failures.push({ name, clipping })
      results.push({ name, passed: true, pagesVisited: step, stamps: allStamps.length, clipping })
      console.log('PASS', name, JSON.stringify({ stamps: allStamps.length, clipping }))
    } catch (error) {
      failures.push({ name, error: String(error), stack: error.stack })
      console.log('FAIL', name, String(error))
      try { await capture(`${name}-failure.png`) } catch { /* keep the original failure */ }
    }
  }
}

async function states() {
  for (const width of [320, 360, 768, 1280]) for (const state of ['missing', 'long', 'loading', 'error']) {
    const name = `${width}-${state}`
    try {
      await browser.navigate(`count=12&state=${state}&member=states-${name}`, width, true)
      await click('.rp-cover')
      const current = await paperState()
      assert.equal(current.overflow, false)
      assert.equal(current.pages.some(page => page.clipped), false, 'Page content clipped')
      assert.equal(await browser.evaluate('document.body.innerText.includes("undefined")'), false)
      if (width === 320 || width === 1280) console.log('SCREENSHOT', await capture(`${name}.png`))
      if (state === 'missing') assert.equal(await browser.evaluate('document.querySelector(".rp-verification") === null'), true)
      if (state === 'loading' || state === 'error') {
        await click(selector)
        assert.equal(await browser.evaluate('document.querySelectorAll(".rp-stamp-button").length'), 0)
        assert.match(await browser.evaluate('document.querySelector(".rp-progress-line").innerText'), /Loading purchases/)
      }
      if (state === 'error') {
        await click('.rp-error button')
        assert.equal(await browser.evaluate('document.querySelector(".rp-error") === null'), true)
        assert.equal(await browser.evaluate('document.querySelectorAll(".rp-stamp-button").length > 0'), true)
      }
      results.push({ name, passed: true })
      console.log('PASS', name)
    } catch (error) {
      failures.push({ name, error: String(error), stack: error.stack })
      console.log('FAIL', name, String(error))
      try { await capture(`${name}-failure.png`) } catch { /* keep the original failure */ }
    }
  }
}

async function interactions() {
  const name = 'interaction-and-seen-stamps'
  try {
    const assertCleanTurn = async expectedPages => {
      const state = await browser.evaluate(`({
        remnants: document.querySelectorAll('.rp-turn-scene, .rp-leaf, .rp-paper-strip').length,
        pages: Array.from(document.querySelectorAll('.rp-paper[data-page-index]')).map(paper => Number(paper.dataset.pageIndex)),
      })`)
      assert.equal(state.remnants, 0, 'Settled turns remove every animated sheet and snapshot')
      assert.equal(state.pages.length, expectedPages, 'Only the resting page or spread remains')
      assert.equal(new Set(state.pages).size, expectedPages, 'No duplicate resting page remains')
    }
    await browser.navigate('count=3&member=interaction&controls=1', 360)
    await key('ArrowRight')
    await key('ArrowRight')
    assert.match(await browser.evaluate('document.querySelector(".rp-page-indicator").innerText'), /Page 2 of 12/)
    assert.equal(await browser.evaluate('document.querySelectorAll("[data-thump=true]").length'), 3)
    const stored = await browser.evaluate('JSON.parse(localStorage.getItem("realm-passport:seen:v1:preview%3Ainteraction"))')
    assert.equal(stored.stamps.length, 3)
    await key('ArrowLeft')
    await key('ArrowRight')
    assert.equal(await browser.evaluate('document.querySelectorAll("[data-thump=true]").length'), 0)
    await click('.passport-preview-controls button')
    assert.equal(await browser.evaluate('document.querySelectorAll("[data-thump=true]").length'), 1)
    assert.equal(await browser.evaluate('document.querySelectorAll(".rp-stamp-button").length'), 4)
    await browser.navigate('count=3&member=interaction', 360)
    await click('.rp-cover')
    await click(selector)
    assert.equal(await browser.evaluate('document.querySelectorAll("[data-thump=true]").length'), 0)

    async function drag(distance, cancel = false) {
      await browser.evaluate('document.querySelector(".rp-book").scrollIntoView({block:"center",behavior:"instant"})')
      await pause(50)
      const box = await browser.evaluate(`(() => { const b=document.querySelector(".rp-book").getBoundingClientRect();return {x:b.x+b.width*${distance > 0 ? '.75' : '.25'},y:b.y+b.height*.5}; })()`)
      assert.equal(await browser.evaluate(`document.querySelector(".rp-book").contains(document.elementFromPoint(${box.x}, ${box.y}))`), true, 'The drag starts on the visible book')
      await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...box })
      await browser.send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...box })
      for (let step = 1; step <= 5; step++) {
        await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', button: 'left', buttons: 1, x: box.x-distance*step/5, y: box.y })
        await pause(25)
      }
      const live = await browser.evaluate('({busy:document.querySelector(".rp-book").getAttribute("aria-busy"),transform:Array.from(document.querySelectorAll(".rp-paper-strip-root, .rp-leaf")).find(sheet => sheet.style.transform && sheet.style.transform !== "none")?.style.transform})')
      assert.equal(live.busy, 'true')
      assert.ok(live.transform && live.transform !== 'none', 'Drag follows pointer before release')
      if (cancel === true) await browser.evaluate('document.querySelector(".rp-book").dispatchEvent(new PointerEvent("pointercancel",{bubbles:true,pointerId:1,isPrimary:true,pointerType:"mouse"}))')
      if (cancel === 'resize') await browser.send('Emulation.setDeviceMetricsOverride', { width: 400, height: 1000, deviceScaleFactor: 1, mobile: false })
      if (cancel === 'blur') await browser.evaluate('window.dispatchEvent(new Event("blur"))')
      await pause(150)
      await browser.send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, x: box.x-distance, y: box.y })
      await settled()
      await assertCleanTurn(await browser.evaluate('document.querySelector(".rp-book").classList.contains("is-wide") ? 2 : 1'))
      return live
    }
    await drag(25)
    assert.match(await browser.evaluate('document.querySelector(".rp-page-indicator").innerText'), /Page 2 of 12/)
    await drag(155)
    assert.match(await browser.evaluate('document.querySelector(".rp-page-indicator").innerText'), /Page 3 of 12/)
    await drag(-155)
    assert.match(await browser.evaluate('document.querySelector(".rp-page-indicator").innerText'), /Page 2 of 12/)
    await drag(155)
    assert.match(await browser.evaluate('document.querySelector(".rp-page-indicator").innerText'), /Page 3 of 12/)
    await drag(150, true)
    assert.match(await browser.evaluate('document.querySelector(".rp-page-indicator").innerText'), /Page 3 of 12/)
    await drag(150, 'resize')
    assert.match(await browser.evaluate('document.querySelector(".rp-page-indicator").innerText'), /Page 3 of 12/)
    await drag(150, 'blur')
    assert.match(await browser.evaluate('document.querySelector(".rp-page-indicator").innerText'), /Page 3 of 12/)
    await browser.evaluate('document.querySelector(".rp-book").focus({preventScroll:true})')
    for (let i=0;i<8;i++) await browser.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight'})
    await settled()
    assert.match(await browser.evaluate('document.querySelector(".rp-page-indicator").innerText'), /Page 4 of 12/)
    await assertCleanTurn(1)
    await key('End')
    assert.equal(await browser.evaluate('document.querySelector(".rp-navigation > button:last-child").disabled'), true)
    await key('Home')
    assert.match(await browser.evaluate('document.querySelector(".rp-page-indicator").innerText'), /Page 1 of 12/)
    await key('Escape')
    assert.equal(await browser.evaluate('!!document.querySelector("button.rp-cover")'), true)
    await assertCleanTurn(0)
    await click('.rp-cover')
    assert.match(await browser.evaluate('document.querySelector(".rp-page-indicator").innerText'), /Page 1 of 12/)
    await assertCleanTurn(1)

    await browser.navigate('count=12&member=desktop-interaction', 1280)
    await click('.rp-cover')
    assert.match(await browser.evaluate('document.querySelector(".rp-page-indicator").innerText'), /Pages 1–2 of 12/)
    await assertCleanTurn(2)
    await click(selector)
    assert.match(await browser.evaluate('document.querySelector(".rp-page-indicator").innerText'), /Pages 3–4 of 12/)
    await assertCleanTurn(2)
    await key('ArrowLeft')
    assert.match(await browser.evaluate('document.querySelector(".rp-page-indicator").innerText'), /Pages 1–2 of 12/)
    await assertCleanTurn(2)
    await drag(210)
    assert.match(await browser.evaluate('document.querySelector(".rp-page-indicator").innerText'), /Pages 3–4 of 12/)
    await drag(-210)
    assert.match(await browser.evaluate('document.querySelector(".rp-page-indicator").innerText'), /Pages 1–2 of 12/)
    results.push({ name, passed: true })
    console.log('PASS', name)
  } catch (error) {
    failures.push({ name, error: String(error), stack: error.stack })
    console.log('FAIL', name, String(error))
    await capture(`${name}-failure.png`)
  }
}

try {
  if (mode !== 'states' && mode !== 'interactions') await matrix()
  if (mode === 'all' || mode === 'states') await states()
  if (mode === 'all' || mode === 'interactions') await interactions()
  const consoleErrors = browser.events.filter(event => event.method === 'Runtime.exceptionThrown' || (event.method === 'Runtime.consoleAPICalled' && ['warning', 'error'].includes(event.params.type)) || (event.method === 'Log.entryAdded' && ['warning', 'error'].includes(event.params.entry.level)))
  const report = { mode, results, failures, consoleErrors, screenshots }
  await writeFile(resolve(browser.output, `report-${mode}.json`), JSON.stringify(report, null, 2))
  console.log('REPORT', JSON.stringify({ passes: results.length, failures, consoleErrors }))
  if (failures.length || consoleErrors.length) process.exitCode = 1
} finally { await browser.close() }
