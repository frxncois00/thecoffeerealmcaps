import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { startPassportBrowser, pause } from './browser-qa.mjs'

const browser = await startPassportBrowser()
const results = []
const failures = []
const point = (x, y) => ({ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 })

async function settled(page) {
  await pause(40)
  await browser.waitFor('document.querySelector(".rp-book").getAttribute("aria-busy") === "false"')
  const state = await browser.evaluate(`({
    page: document.querySelector('.rp-page-indicator > span').textContent,
    remnants: document.querySelectorAll('.rp-turn-scene, .rp-leaf, .rp-paper-strip').length,
    papers: document.querySelectorAll('.rp-paper[data-page-index]').length,
  })`)
  assert.equal(state.page, `Page ${page} of 12`)
  assert.equal(state.remnants, 0, 'The touch turn leaves no animated sheet or scene')
  assert.equal(state.papers, 1, 'Only one resting page remains on mobile')
}

async function drag({ name, distance, page, stampIndex, cancel = false }) {
  await browser.evaluate('document.querySelector(".rp-book").scrollIntoView({block:"center",behavior:"instant"})')
  await pause(50)
  const start = await browser.evaluate(`(() => {
    const book = document.querySelector('.rp-book')
    const stamp = ${stampIndex == null ? 'null' : `book.querySelectorAll('.rp-stamp-button')[${stampIndex}]`}
    const rect = (stamp || book).getBoundingClientRect()
    const x = rect.x + rect.width * (stamp ? .5 : .8)
    const y = rect.y + rect.height * (stamp ? .5 : .28)
    const target = document.elementFromPoint(x, y)
    return { x, y, onBook: book.contains(target), onStamp: !!target?.closest('.rp-stamp-button') }
  })()`)
  assert.equal(start.onBook, true, 'Touch begins on the visible book')
  if (stampIndex != null) assert.equal(start.onStamp, true, 'Touch begins directly on an earned stamp button')
  await browser.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(start.x, start.y)] })
  for (let step = 1; step <= 5; step++) {
    await browser.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(start.x - distance * step / 5, start.y)] })
    await pause(30)
  }
  const live = await browser.evaluate(`({
    busy: document.querySelector('.rp-book').getAttribute('aria-busy'),
    transform: Array.from(document.querySelectorAll('.rp-paper-strip-root, .rp-leaf')).find(sheet => sheet.style.transform && sheet.style.transform !== 'none')?.style.transform,
  })`)
  assert.equal(live.busy, 'true', 'The touch drag remains active before release')
  assert.ok(live.transform, 'The sheet follows touch movement')
  await pause(150)
  await browser.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] })
  await settled(page)
  results.push({ name, passed: true, startedOnStamp: start.onStamp, liveTransform: live.transform, page })
  console.log('PASS', name)
}

try {
  await browser.navigate('count=12&member=touch-verification', 360)
  await browser.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 })
  await browser.evaluate(`window.passportTouchEvents = [];
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'gotpointercapture', 'lostpointercapture']) {
      document.addEventListener(type, event => window.passportTouchEvents.push({ type, pointerType: event.pointerType, target: event.target.className, id: event.pointerId }), true)
    }`)
  const cover = await browser.evaluate(`(() => {
    const element = document.querySelector('.rp-cover')
    element.scrollIntoView({ block: 'center', behavior: 'instant' })
    const rect = element.getBoundingClientRect()
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
  })()`)
  await browser.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(cover.x, cover.y)] })
  await browser.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await settled(1)
  results.push({ name: 'touch-open-cover', passed: true })
  await drag({ name: 'touch-forward-from-paper', distance: 150, page: 2 })
  await pause(450)
  await drag({ name: 'touch-forward-from-earned-stamp', distance: 150, stampIndex: 1, page: 3 })
  await drag({ name: 'touch-backward-from-earned-stamp', distance: -150, stampIndex: 0, page: 2 })
  await drag({ name: 'touch-short-drag-snaps-back', distance: 25, stampIndex: 1, page: 2 })
  await drag({ name: 'touch-cancellation-from-earned-stamp', distance: 150, stampIndex: 1, cancel: true, page: 2 })
  const pointerTypes = await browser.evaluate('Array.from(new Set(window.passportTouchEvents.map(event => event.pointerType)))')
  assert.deepEqual(pointerTypes, ['touch'], 'The test uses touch pointers, not emulated mouse drags')
} catch (error) {
  failures.push({ error: String(error), stack: error.stack, pointerEvents: await browser.evaluate('window.passportTouchEvents') })
  console.log('FAIL', String(error))
  console.log('SCREENSHOT', await browser.screenshot('touch-failure.png'))
  process.exitCode = 1
} finally {
  const consoleErrors = browser.events.filter(event => event.method === 'Runtime.exceptionThrown' || (event.method === 'Runtime.consoleAPICalled' && ['warning', 'error'].includes(event.params.type)) || (event.method === 'Log.entryAdded' && ['warning', 'error'].includes(event.params.entry.level)))
  if (consoleErrors.length) process.exitCode = 1
  const report = { results, failures, consoleErrors }
  await writeFile(resolve(browser.output, 'report-touch.json'), JSON.stringify(report, null, 2))
  console.log('REPORT', JSON.stringify(report))
  await browser.close()
}
