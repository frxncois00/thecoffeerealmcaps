import { retryJwtTimingRequest } from '../lib/supabaseRetry.js'

const hasClaim = (member, number) => member.claims.some(claim => Number(claim.reward_number) === number)

// The cashier must have authoritative claim history before offering redemption.
export function createCashierPassportApi(client) {
  async function lookup(realmId) {
    const normalizedId = realmId.trim().toUpperCase()
    const { data, error } = await retryJwtTimingRequest(() => client.rpc('lookup_realm_passport', {
      p_realm_id: normalizedId,
    }))
    if (error) throw error
    if (!data) return null
    if (data.id !== normalizedId || !data.profile || !Array.isArray(data.orders) || !Array.isArray(data.claims) || !Array.isArray(data.eligible_rewards)) {
      throw new Error('Reward status is unavailable. Please refresh the passport before claiming.')
    }
    return data
  }

  async function claim(member, number) {
    let recorded
    try {
      const { data, error } = await retryJwtTimingRequest(() => client.rpc('claim_realm_passport_reward', {
        p_realm_id: member.id,
        p_reward_number: number,
      }))
      if (error) throw error
      if (Number(data?.reward_number) !== number || !data?.claimed_at) {
        throw new Error('The claim could not be confirmed. Please check the passport before trying again.')
      }
      recorded = data
    } catch (error) {
      // A timeout can happen after commit, or another cashier may have claimed it.
      // Reconcile the record instead of blindly offering the same reward again.
      let refreshed
      try { refreshed = await lookup(member.id) } catch { /* Keep the original claim error. */ }
      if (refreshed && hasClaim(refreshed, number)) return { member: refreshed, refreshError: '' }
      throw error
    }

    const withClaim = current => ({
      ...current,
      claims: [...current.claims.filter(claim => Number(claim.reward_number) !== number), recorded],
    })
    try {
      const refreshed = await lookup(member.id)
      if (!refreshed) throw new Error('Passport no longer available.')
      return { member: withClaim(refreshed), refreshError: '' }
    } catch {
      // A successful write stays claimed even when its follow-up read fails.
      return { member: withClaim(member), refreshError: 'Reward claimed. Refresh the passport before claiming another reward.' }
    }
  }

  return { lookup, claim }
}
