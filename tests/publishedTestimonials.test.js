import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizePublishedTestimonials } from '../src/utils/publishedTestimonials.js'

test('public reviews exclude every seeded placeholder and unpublished draft', () => {
  const rows = [
    ...['00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', 'default-mika', 'default-ari', 'default-nico']
      .map((id) => ({ id, visible: true, quote: 'Placeholder quote' })),
    { id: 'draft', visible: false, quote: 'Not approved for the public homepage' },
    { id: 'unknown-status', quote: 'Not explicitly published' },
    { id: 'published', visible: true, quote: 'The actual published review' },
  ]
  assert.deepEqual(normalizePublishedTestimonials(rows).map((row) => row.id), ['published'])
})

test('public reviews preserve admin ordering, exact quotes, identity and rating without mutating data', () => {
  const first = Object.freeze({ id: 'first', visible: true, display_order: 2, username: 'coffee.customer', name: 'Customer Name', avatar_url: '/avatar.webp', quote: 'Warm service — and excellent coffee! ☕', rating: 4 })
  const second = Object.freeze({ id: 'second', visible: true, display_order: 2, name: 'Another Customer', quote: 'A second approved quote.', rating: 3 })
  const rows = Object.freeze([first, second])
  const result = normalizePublishedTestimonials(rows)
  assert.deepEqual(result, [first, second])
  assert.equal(result[0], first)
  assert.equal(result[1], second)
  assert.notEqual(result, rows)
})

test('missing or empty public results stay empty, never substitute example reviews', () => {
  assert.deepEqual(normalizePublishedTestimonials(), [])
  assert.deepEqual(normalizePublishedTestimonials(null), [])
  assert.deepEqual(normalizePublishedTestimonials([]), [])
})
