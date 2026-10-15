import test from 'node:test'
import assert from 'node:assert/strict'
import { createCashierPassportApi } from '../src/services/cashierPassportApi.js'
import { buildPassportPresentation } from '../src/utils/realmPassportPresentation.js'

const member = () => ({
  id: 'TCR-1234', profile: { username: 'Test member' },
  orders: Array.from({ length: 5 }, (_, i) => ({ id: `order-${i}`, status: 'completed', payment_status: 'paid', created_at: '2026-10-01' })),
  claims: [], eligible_rewards: [1],
})
const recorded = { reward_number: 1, claimed_at: '2026-10-14T03:00:00Z' }
function apiWith(...responses) {
  const calls = []
  const api = createCashierPassportApi({ rpc: async (name, args) => {
    calls.push({ name, args })
    assert.ok(responses.length, 'Unexpected additional request')
    const response = responses.shift()
    if (response instanceof Error) throw response
    return response
  } })
  return { ...api, calls }
}

test('cashier lookup normalizes the ID and retains server claim history', async () => {
  const data = { ...member(), claims: [recorded] }
  const api = apiWith({ data })
  assert.deepEqual(await api.lookup(' tcr-1234 '), data)
  assert.deepEqual(api.calls[0], { name: 'lookup_realm_passport', args: { p_realm_id: 'TCR-1234' } })
  assert.equal(buildPassportPresentation(data).summary.claimableRewards.length, 0)
})

test('lookup fails closed when claim history, eligibility, or the matching identity is missing', async () => {
  for (const data of [{ ...member(), claims: undefined }, { ...member(), eligible_rewards: undefined }, { ...member(), id: 'TCR-9999' }]) {
    await assert.rejects(apiWith({ data }).lookup('TCR-1234'), /Reward status is unavailable/)
  }
  assert.equal(await apiWith({ data: null }).lookup('TCR-1234'), null)
})

test('successful redemption reloads authoritative state and records the reward once', async () => {
  const api = apiWith({ data: recorded }, { data: { ...member(), claims: [recorded] } })
  const result = await api.claim(member(), 1)
  assert.deepEqual(result.member.claims, [recorded])
  assert.equal(result.refreshError, '')
  assert.equal(buildPassportPresentation(result.member).summary.claimableRewards.length, 0)
  assert.deepEqual(api.calls.map(call => call.name), ['claim_realm_passport_reward', 'lookup_realm_passport'])
  assert.deepEqual(api.calls[0].args, { p_realm_id: 'TCR-1234', p_reward_number: 1 })
})

test('a successful claim remains claimed when the follow-up read is stale', async () => {
  const result = await apiWith({ data: recorded }, { data: member() }).claim(member(), 1)
  assert.deepEqual(result.member.claims, [recorded])
})

test('a successful claim stays claimed and requires refresh when the follow-up read fails', async () => {
  const result = await apiWith({ data: recorded }, new Error('Network unavailable')).claim(member(), 1)
  assert.deepEqual(result.member.claims, [recorded])
  assert.match(result.refreshError, /Reward claimed/)
})

test('another cashier claiming first reconciles to Claimed without resubmitting', async () => {
  const api = apiWith({ error: new Error('This reward has already been claimed') }, { data: { ...member(), claims: [recorded] } })
  const result = await api.claim(member(), 1)
  assert.deepEqual(result.member.claims, [recorded])
  assert.equal(api.calls.filter(call => call.name === 'claim_realm_passport_reward').length, 1)
})

test('a lost write response reconciles a committed claim without a second write', async () => {
  const api = apiWith(new Error('Request timed out'), { data: { ...member(), claims: [recorded] } })
  assert.deepEqual((await api.claim(member(), 1)).member.claims, [recorded])
  assert.equal(api.calls.length, 2)
})

test('a rejected or unconfirmed claim never creates a local redemption', async () => {
  await assert.rejects(apiWith({ error: new Error('This reward is not yet available') }, { data: member() }).claim(member(), 1), /not yet available/)
  await assert.rejects(apiWith({ data: { ...recorded, reward_number: 2 } }, { data: member() }).claim(member(), 1), /could not be confirmed/)
  await assert.rejects(apiWith(new Error('Write failed'), new Error('Read failed')).claim(member(), 1), /Write failed/)
})
