import test from 'node:test'
import assert from 'node:assert/strict'
import { buildReceiptHtml, normalizeReceiptData } from '../src/components/common/receiptUtils.js'

test('passport ID survives customer and transaction receipt shapes and precedes thank you', () => {
  for (const order of [{ realm_passport_id: 'TCR-1234' }, { realmPassportId: 'TCR-1234' }]) {
    assert.equal(normalizeReceiptData(order).realmPassportId, 'TCR-1234')
    for (const order_type of ['walk-in', 'pickup', 'delivery']) {
      const html = buildReceiptHtml({ ...order, order_type })
      assert.ok(html.includes('Realm Passport ID:'))
      assert.ok(html.indexOf('TCR-1234') < html.indexOf('Thank you'))
    }
  }
})

test('guest receipts omit passport row and passport values are HTML escaped', () => {
  assert.equal(buildReceiptHtml({}).includes('Realm Passport ID:'), false)
  const html = buildReceiptHtml({ realmPassportId: '<script>oops</script>' })
  assert.equal(html.includes('<script>'), false)
  assert.ok(html.includes('&lt;script&gt;'))
})
