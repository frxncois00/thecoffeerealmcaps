import test from 'node:test'
import assert from 'node:assert/strict'
import {scheduleSlots} from '../src/utils/checkoutSchedule.js'
const now=Date.parse('2026-10-22T14:10:00+08:00')
test('pickup and delivery respect minimum lead times',()=>{
assert.equal(scheduleSlots('2026-10-22','pickup',{},0,now)[0].id,'15:00')
assert.equal(scheduleSlots('2026-10-22','delivery',{},0,now)[0].id,'15:30')
})
test('large orders shift pickup later',()=>{
assert.equal(scheduleSlots('2026-10-22','pickup',{},105,now)[0].id,'16:00')
})
test('expiry, closing time, and yesterday',()=>{
assert.equal(scheduleSlots('2026-10-22','pickup',{},0,Date.parse('2026-10-22T14:30:00+08:00'))[0].id,'15:30')
assert.deepEqual(scheduleSlots('2026-10-22','pickup',{},0,Date.parse('2026-10-22T23:00:00+08:00')),[])
assert.deepEqual(scheduleSlots('2026-10-21','pickup',{},0,now),[])
})

test('custom hours, future dates and prep extending beyond closing',()=>{
assert.equal(scheduleSlots('2026-10-23','pickup',{openTime:'11:15',closeTime:'18:00'},105,now)[0].id,'11:30')
assert.deepEqual(scheduleSlots('2026-10-22','pickup',{closeTime:'15:00'},105,now),[])
assert.equal(scheduleSlots('2026-10-22','delivery',{},105,now)[0].id,'16:00')
})
