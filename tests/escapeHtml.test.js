import test from 'node:test'
import assert from 'node:assert/strict'
import { escapeHtml } from '../src/utils/escapeHtml.js'

test('receipt and report HTML encodes customer supplied markup', () => {
  assert.equal(
    escapeHtml(`<img src=x onerror="alert('x')">&`),
    '&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;',
  )
  assert.equal(escapeHtml(null), '')
})
