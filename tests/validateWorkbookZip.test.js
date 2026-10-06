import test from 'node:test'
import assert from 'node:assert/strict'
import { validateWorkbookZip } from '../src/utils/validateWorkbookZip.js'

function zipDirectory(compressed, uncompressed) {
  const bytes = new Uint8Array(68)
  const view = new DataView(bytes.buffer)
  view.setUint32(0, 0x02014b50, true)
  view.setUint32(20, compressed, true)
  view.setUint32(24, uncompressed, true)
  view.setUint32(46, 0x06054b50, true)
  view.setUint16(56, 1, true)
  view.setUint32(58, 46, true)
  view.setUint32(62, 0, true)
  return bytes.buffer
}

test('rejects an Excel archive whose declared expansion is unsafe', () => {
  assert.throws(() => validateWorkbookZip(zipDirectory(100, 10_000_000)), /safe archive limits/)
  assert.throws(() => validateWorkbookZip(zipDirectory(10_000, 26 * 1024 * 1024)), /safe archive limits/)
})

test('accepts a bounded archive and rejects malformed input', () => {
  assert.doesNotThrow(() => validateWorkbookZip(zipDirectory(100, 1000)))
  assert.throws(() => validateWorkbookZip(new Uint8Array(20).buffer), /Invalid Excel file/)
})
