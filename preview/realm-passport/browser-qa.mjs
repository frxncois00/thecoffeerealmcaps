// Dependency-free, isolated Chrome harness for the passport preview.
// Start Vite on 127.0.0.1:5192 before importing this module.
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export const pause = ms => new Promise(resolvePause => setTimeout(resolvePause, ms))

export async function startPassportBrowser() {
  const output = resolve('tmp/realm-passport-qa')
  await mkdir(output, { recursive: true })
  const userDataDir = await mkdtemp(resolve(output, 'chrome-'))
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--disable-component-update', '--disable-extensions',
    '--remote-debugging-port=0', `--user-data-dir=${userDataDir}`, 'about:blank',
  ], { windowsHide: true, stdio: 'ignore' })
  let port
  for (let tries = 0; tries < 80; tries++) {
    try { port = (await readFile(resolve(userDataDir, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch { await pause(100) }
  }
  if (!port) { chrome.kill(); throw new Error('Isolated Chrome did not expose a debugging port') }
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  const socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl)
  await new Promise((ok, fail) => { socket.onopen = ok; socket.onerror = fail })
  let sequence = 0
  const pending = new Map()
  const events = []
  socket.onmessage = message => {
    const response = JSON.parse(message.data)
    if (response.id) {
      const request = pending.get(response.id)
      if (!request) return
      pending.delete(response.id)
      clearTimeout(request.timeout)
      if (response.error) request.reject(new Error(JSON.stringify(response.error)))
      else request.resolve(response.result)
    } else events.push(response)
  }
  function send(method, params = {}) {
    return new Promise((resolveRequest, reject) => {
      const id = ++sequence
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)) }, 12000)
      pending.set(id, { resolve: resolveRequest, reject, timeout })
      socket.send(JSON.stringify({ id, method, params }))
    })
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  async function waitFor(expression, timeout = 10000) {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      if (await evaluate(expression)) return
      await pause(50)
    }
    throw new Error(`Condition did not become true: ${expression}`)
  }
  async function navigate(query = '', width = 360, reducedMotion = false) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false })
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' }] })
    await send('Page.navigate', { url: `http://127.0.0.1:5192/preview/realm-passport/?${query}` })
    try { await waitFor('!!document.querySelector(".realm-scene")', 30000) } catch (error) {
      console.log(await evaluate('({ url: location.href, text: document.body?.innerText })'))
      console.log(JSON.stringify(events.filter(event => ['Runtime.exceptionThrown', 'Runtime.consoleAPICalled', 'Log.entryAdded', 'Network.loadingFailed'].includes(event.method))))
      console.log(await evaluate('({ ready: document.readyState, resources: performance.getEntriesByType("resource").map(entry => ({ name: entry.name, duration: entry.duration })) })'))
      throw error
    }
    await evaluate('document.fonts.ready.then(() => true)')
    await waitFor('Array.from(document.images).every(image => image.complete && image.naturalWidth > 0)', 15000)
    await pause(150)
  }
  async function click(selector) {
    const point = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) throw new Error('Missing click target'); element.scrollIntoView({block:'center',behavior:'instant'}); const box = element.getBoundingClientRect(); return { x: box.x + box.width/2, y: box.y + box.height/2 }; })()`)
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point })
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point })
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point })
  }
  async function screenshot(name, viewportOnly = false) {
    const path = resolve(output, name)
    const layout = await send('Page.getLayoutMetrics')
    const result = await send('Page.captureScreenshot', viewportOnly ? { format: 'png', captureBeyondViewport: false } : { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: layout.cssContentSize.width, height: layout.cssContentSize.height, scale: 1 } })
    await writeFile(path, Buffer.from(result.data, 'base64'))
    return path
  }
  async function close() {
    try { await send('Browser.close') } catch { /* browser may close before replying */ }
    socket.close()
    chrome.kill()
  }
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Log.enable')
  await send('Network.enable')
  return { send, evaluate, waitFor, navigate, click, screenshot, close, events, output }
}

// Run verification directly: node preview/realm-passport/verify-preview.mjs.
// Importing it here creates a top-level-await cycle with its harness import.

if (process.argv[2] === 'baseline') {
  const browser = await startPassportBrowser()
  try {
    for (const width of [360, 768, 1280]) {
      await browser.navigate(`count=3&member=baseline-${width}`, width)
      console.log(await browser.screenshot(`before-${width}-cover.png`))
    }
    console.log(JSON.stringify(browser.events.filter(event => ['Runtime.exceptionThrown', 'Log.entryAdded'].includes(event.method))))
  } finally { await browser.close() }
}
