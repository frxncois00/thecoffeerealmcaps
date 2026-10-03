import test from 'node:test'
import assert from 'node:assert/strict'

function cleanStatusText(text) {
  return text.replace(/\.{2,}|…/g, '').trim()
}

function extractFirstName(fullName, fallback = '') {
  const cleaned = String(fullName || '').trim()
  if (cleaned && cleaned !== 'Coffee Realm Customer') {
    return cleaned.split(/\s+/)[0]
  }
  return String(fallback || '').trim()
}

function computeRemainingDisplayTime(startTime, currentTime, minDuration = 1500) {
  const elapsed = currentTime - startTime
  return Math.max(0, minDuration - elapsed)
}

function resolveFarewellSubtext(firstName) {
  return firstName ? `See you next time, ${firstName}` : 'See you next time'
}

test('cleanStatusText strips trailing dots from logout status text', () => {
  assert.equal(cleanStatusText('Signing you out…'), 'Signing you out')
  assert.equal(cleanStatusText('Signing you out...'), 'Signing you out')
  assert.equal(cleanStatusText('See you next time, Francis'), 'See you next time, Francis')
})

test('extractFirstName retrieves first name for customers and staff', () => {
  assert.equal(extractFirstName('Francis Miller'), 'Francis')
  assert.equal(extractFirstName('Maria Clara Santos'), 'Maria')
  assert.equal(extractFirstName('Coffee Realm Customer', 'coffeeguy'), 'coffeeguy')
  assert.equal(extractFirstName('', 'cashier_user'), 'cashier_user')
  assert.equal(extractFirstName(null, ''), '')
})

test('computeRemainingDisplayTime guarantees minimum duration of 1500ms for logout animation', () => {
  const startTime = 1000
  // Fast local signout (150ms elapsed) -> must wait 1350ms
  assert.equal(computeRemainingDisplayTime(startTime, 1150, 1500), 1350)
  // Moderate network signout (800ms elapsed) -> must wait 700ms
  assert.equal(computeRemainingDisplayTime(startTime, 1800, 1500), 700)
  // Slow network signout (2200ms elapsed) -> 0ms remaining
  assert.equal(computeRemainingDisplayTime(startTime, 3200, 1500), 0)
})

test('resolveFarewellSubtext formats personalized goodbye or clean fallback', () => {
  assert.equal(resolveFarewellSubtext('Francis'), 'See you next time, Francis')
  assert.equal(resolveFarewellSubtext('Danica'), 'See you next time, Danica')
  assert.equal(resolveFarewellSubtext(''), 'See you next time')
  assert.equal(resolveFarewellSubtext(null), 'See you next time')
})

test('simulated logout failure: dismisses goodbye screen, sets error, keeps user logged in', async () => {
  let userLoggedIn = true
  let transitionState = { active: true, statusText: 'Signing you out…' }
  let errorMessage = ''
  let loggingOut = true

  // Simulate network failure during signOut
  const failingSignOut = async () => {
    throw new Error('Network error: Failed to reach auth server.')
  }

  try {
    await failingSignOut()
    userLoggedIn = false
  } catch (err) {
    transitionState = null
    loggingOut = false
    errorMessage = err.message
  }

  // Assert user is NOT signed out and transition screen is closed with error
  assert.equal(userLoggedIn, true)
  assert.equal(transitionState, null)
  assert.equal(loggingOut, false)
  assert.equal(errorMessage, 'Network error: Failed to reach auth server.')
})

test('double-click prevention: prevents concurrent logout executions', async () => {
  let executionCount = 0
  let loggingOut = false

  async function triggerLogout() {
    if (loggingOut) return 'ignored'
    loggingOut = true
    executionCount += 1
    // simulate async work
    await new Promise((r) => setTimeout(r, 10))
    loggingOut = false
    return 'completed'
  }

  const [res1, res2] = await Promise.all([triggerLogout(), triggerLogout()])
  assert.equal(executionCount, 1)
  assert.ok(res1 === 'completed' || res2 === 'completed')
  assert.ok(res1 === 'ignored' || res2 === 'ignored')
})
