import test from 'node:test'
import assert from 'node:assert/strict'

function extractFirstName(fullName, fallbackUsername = '') {
  const cleaned = String(fullName || '').trim()
  if (cleaned && cleaned !== 'Coffee Realm Customer') {
    return cleaned.split(/\s+/)[0]
  }
  return String(fallbackUsername || '').trim()
}

function computeRemainingDisplayTime(startTime, currentTime, minDuration = 1500) {
  const elapsed = currentTime - startTime
  return Math.max(0, minDuration - elapsed)
}

function cleanStatusText(text) {
  return text.replace(/\.{2,}|…/g, '').trim()
}

function resolveWelcomeSubtext(statusText, firstName) {
  if (firstName) {
    return `Welcome back, ${firstName}`
  }
  return statusText
}

test('cleanStatusText strips trailing periods and ellipsis characters', () => {
  assert.equal(cleanStatusText('Signing you in…'), 'Signing you in')
  assert.equal(cleanStatusText('Finishing your Google sign-in...'), 'Finishing your Google sign-in')
  assert.equal(cleanStatusText('Welcome back, Francis'), 'Welcome back, Francis')
})

test('extractFirstName retrieves first name from full name or falls back to username', () => {
  assert.equal(extractFirstName('Francis Miller', 'fmiller'), 'Francis')
  assert.equal(extractFirstName('Maria Clara De Los Santos', 'mariac'), 'Maria')
  assert.equal(extractFirstName('Coffee Realm Customer', 'coffeefan'), 'coffeefan')
  assert.equal(extractFirstName('', 'coffeefan'), 'coffeefan')
  assert.equal(extractFirstName(null, 'user123'), 'user123')
})

test('computeRemainingDisplayTime guarantees minimum display duration of 1500ms', () => {
  const start = 1000
  // Fast auth (200ms elapsed) -> must wait remaining 1300ms
  assert.equal(computeRemainingDisplayTime(start, 1200, 1500), 1300)
  // Auth taking 1000ms -> must wait remaining 500ms
  assert.equal(computeRemainingDisplayTime(start, 2000, 1500), 500)
  // Slow network auth taking 2500ms -> does not delay further (0ms remaining)
  assert.equal(computeRemainingDisplayTime(start, 3500, 1500), 0)
})

test('resolveWelcomeSubtext formats greeting when first name is available', () => {
  assert.equal(resolveWelcomeSubtext('Signing you in…', 'Francis'), 'Welcome back, Francis')
  assert.equal(resolveWelcomeSubtext('Finishing your Google sign-in…', 'Danica'), 'Welcome back, Danica')
  assert.equal(resolveWelcomeSubtext('Finishing your Google sign-in…', ''), 'Finishing your Google sign-in…')
})

test('invalid credentials flow rejects before welcome transition', () => {
  let welcomeTriggered = false
  let errorMessage = ''

  function handleLoginResult({ error, session }) {
    if (error || !session) {
      errorMessage = error?.message || 'Invalid username, email, or password.'
      return
    }
    welcomeTriggered = true
  }

  // Failed login
  handleLoginResult({ error: new Error('Invalid login credentials'), session: null })
  assert.equal(welcomeTriggered, false)
  assert.equal(errorMessage, 'Invalid login credentials')

  // Successful login
  handleLoginResult({ error: null, session: { user: { id: 'u-1' } } })
  assert.equal(welcomeTriggered, true)
})
