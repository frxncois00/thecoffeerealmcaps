import test from 'node:test'
import assert from 'node:assert/strict'
import { slidingPageNumbers } from '../src/utils/pagination.js'

test('sliding windows include the active page and never offer nonexistent pages', () => {
  for (const total of [1, 2, 3, 4, 10, 542]) {
    for (let page = 1; page <= total; page += 1) {
      const numbers = slidingPageNumbers(page, total)
      assert.equal(numbers.length, Math.min(3, total))
      assert.ok(numbers.includes(page))
      assert.ok(numbers.every((number) => number >= 1 && number <= total))
      assert.equal(new Set(numbers).size, numbers.length)
      assert.equal(numbers.at(-1) - numbers[0], numbers.length - 1)
    }
  }
})
