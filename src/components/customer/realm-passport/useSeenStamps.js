import { useMemo } from 'react'

const memberRecords = new Map()
const storagePrefix = 'realm-passport:seen:v1:'

function recordFor(memberKey) {
  if (!memberRecords.has(memberKey)) {
    memberRecords.set(memberKey, { stamps: new Set(), rewards: new Set() })
  }
  return memberRecords.get(memberKey)
}

function readStoredRecord(storageKey, record) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) || '{}')
    if (Array.isArray(saved?.stamps)) saved.stamps.forEach(id => record.stamps.add(String(id)))
    if (Array.isArray(saved?.rewards)) saved.rewards.forEach(number => record.rewards.add(String(number)))
  } catch {
    // Private browsing, unavailable storage, and malformed old data all fall
    // back to the in-memory record, which survives component remounts.
  }
}

function saveRecord(storageKey, record) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify({
      stamps: [...record.stamps],
      rewards: [...record.rewards],
    }))
  } catch {
    // Claiming still succeeds once per session when storage is unavailable.
  }
}

// Claim only from an effect for a visible stamp/reward, never while rendering
// hidden pages or their animation copies. A true result belongs to that mounted
// stamp; keep it through StrictMode's effect replay instead of claiming twice.
export function createSeenStampTracker(memberKey) {
  const key = memberKey == null ? '' : String(memberKey)
  const storageKey = storagePrefix + encodeURIComponent(key)

  function claim(kind, value) {
    if (!key || value == null || value === '') return false
    const record = recordFor(key)
    readStoredRecord(storageKey, record)
    const token = String(value)
    if (record[kind].has(token)) return false
    record[kind].add(token)
    saveRecord(storageKey, record)
    return true
  }

  return {
    claimStamp: orderId => claim('stamps', orderId),
    claimReward: chapterNumber => claim('rewards', chapterNumber),
  }
}

export function useSeenStamps(memberKey) {
  return useMemo(() => createSeenStampTracker(memberKey), [memberKey])
}
