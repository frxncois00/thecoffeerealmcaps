import assert from 'node:assert/strict'
import test from 'node:test'
import { isValidEmail, sanitizeAddressText, sanitizeCustomerText, sanitizeDigits, sanitizeEmail, sanitizePersonName, sanitizeUsername } from '../src/utils/inputValidation.js'

test('customer input rules keep ordinary details while rejecting markup and control characters', () => {
  assert.equal(sanitizePersonName("María Dela Cruz123<script>"), 'María Dela Cruzscript')
  assert.equal(sanitizeUsername('coffee.realm;DROP'), 'coffee.realmDROP')
  assert.equal(sanitizeDigits('09 12-ab', 4), '0912')
  assert.equal(sanitizeEmail('a<script>@example.com'), 'ascript@example.com')
  assert.equal(sanitizeAddressText('Unit #2, St. Anne <script>'), 'Unit #2, St. Anne script')
  assert.equal(sanitizeCustomerText('No ice <script>\nPlease call.', 80), 'No ice script\nPlease call.')
  assert.equal(isValidEmail('customer@example.com'), true)
  assert.equal(isValidEmail("' OR 1=1--@example.com"), false)
})
