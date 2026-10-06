import test from 'node:test'
import assert from 'node:assert/strict'
import { authorizedOcrKey, supportedImageFormat } from '../server/ocrSecurity.js'

test('OCR requires the configured key', () => {
  assert.equal(authorizedOcrKey('abc', 'abc'), true)
  assert.equal(authorizedOcrKey('abc', 'abd'), false)
  assert.equal(authorizedOcrKey('abc', ''), false)
  assert.equal(authorizedOcrKey('', 'abc'), false)
})

test('OCR accepts only decoded raster formats', () => {
  assert.equal(supportedImageFormat('png'), true)
  assert.equal(supportedImageFormat('webp'), true)
  assert.equal(supportedImageFormat('svg'), false)
  assert.equal(supportedImageFormat(undefined), false)
})
