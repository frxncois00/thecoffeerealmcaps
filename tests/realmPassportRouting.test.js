import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

test('direct passport navigation and refresh serve the authenticated app, not the sample design', async () => {
  const server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    logLevel: 'silent',
    server: { host: '127.0.0.1', port: 0, watch: null, preTransformRequests: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  })
  try {
    await server.listen()
    const origin = `http://127.0.0.1:${server.httpServer.address().port}`
    for (const route of ['/realm-passport', '/realm-passport?refresh=1', '/realm-passport/']) {
      const response = await fetch(origin + route, { headers: { Accept: 'text/html' } })
      assert.equal(response.status, 200)
      const html = await response.text()
      assert.match(html, /src="\/src\/main\.jsx"/)
      assert.doesNotMatch(html, /realm-passport-preview\.jsx/)
    }
    const preview = await fetch(origin + '/preview/passport-design/')
    assert.match(await preview.text(), /realm-passport-preview\.jsx/)
  } finally {
    await server.close()
  }
})
