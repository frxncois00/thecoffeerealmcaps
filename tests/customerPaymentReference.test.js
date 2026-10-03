import test from 'node:test'
import assert from 'node:assert/strict'

function formatDuplicateReferenceError(referenceNumber) {
  const cleanRef = String(referenceNumber || '').trim()
  return cleanRef
    ? `Reference number ${cleanRef} has already been used by another customer. Please enter a valid, unused reference number.`
    : 'This payment reference number has already been used by another customer. Please enter the valid reference from your payment receipt.'
}

test('formatDuplicateReferenceError includes the specific reference number when available', () => {
  const error = formatDuplicateReferenceError('1234567890123')
  assert.equal(error, 'Reference number 1234567890123 has already been used by another customer. Please enter a valid, unused reference number.')
})

test('formatDuplicateReferenceError falls back cleanly when reference number is missing', () => {
  const error = formatDuplicateReferenceError('')
  assert.equal(error, 'This payment reference number has already been used by another customer. Please enter the valid reference from your payment receipt.')
})

test('duplicate error detection regex catches database unique index errors', () => {
  const errorMsg1 = 'duplicate key value violates unique constraint "payments_unique_reference_number_idx"'
  const errorMsg2 = 'This payment reference number has already been used by another customer'
  const isDuplicate = (msg) => /duplicate key|unique constraint|payments_unique_reference_number_idx|already.*used/i.test(msg)
  
  assert.equal(isDuplicate(errorMsg1), true)
  assert.equal(isDuplicate(errorMsg2), true)
  assert.equal(isDuplicate('Some other random error'), false)
})

import { isTwoWordPersonName } from '../src/utils/inputValidation.js'

test('isTwoWordPersonName accepts 2 or more words and rejects single word names', () => {
  assert.equal(isTwoWordPersonName('John'), false)
  assert.equal(isTwoWordPersonName(''), false)
  assert.equal(isTwoWordPersonName('   '), false)
  assert.equal(isTwoWordPersonName('John Doe'), true)
  assert.equal(isTwoWordPersonName('John Michael Doe'), true)
  assert.equal(isTwoWordPersonName('Maria Del Rosario De La Cruz'), true)
  assert.equal(isTwoWordPersonName('   Juan   Dela   Cruz   '), true)
})
