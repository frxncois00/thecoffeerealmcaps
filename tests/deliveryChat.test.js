import test from 'node:test'
import assert from 'node:assert/strict'
import { deliveryChatIsOpen, deliveryCountdown, dispatchNeedsTracking, hasDeliveryChat, mergeDeliveryMessages } from '../src/utils/deliveryChat.js'

const now=Date.parse('2026-10-30T12:00:00Z')
test('delivery chat closes at the exact deadline, on completion, cancellation or a hold',()=>{
  const live={status:'Out for Delivery',confirmation_deadline:'2026-10-30T13:00:00Z'}
  assert.equal(deliveryChatIsOpen(live,now),true)
  assert.equal(deliveryChatIsOpen(live,now+3600000-1),true)
  assert.equal(deliveryChatIsOpen(live,now+3600000),false)
  for(const status of ['Completed','Received','Cancelled'])assert.equal(deliveryChatIsOpen({...live,status},now),false)
  assert.equal(deliveryChatIsOpen({...live,closed_at:'2026-10-30T11:59:59Z'},now),false)
  assert.equal(deliveryChatIsOpen({...live,fulfillment_hold:true},now),false)
  assert.equal(deliveryChatIsOpen({...live,cancellation_status:'requested'},now),false)
  assert.equal(deliveryChatIsOpen({...live,confirmation_deadline:'invalid'},now),false)
})
test('only prepared delivery orders expose conversations, including read-only history',()=>{
  assert.equal(hasDeliveryChat({order_type:'pickup',status:'Ready for Pickup'}),false)
  assert.equal(hasDeliveryChat({order_type:'delivery',status:'Preparing'}),false)
  assert.equal(hasDeliveryChat({order_type:'delivery',status:'Ready for Pickup'}),true)
  assert.equal(hasDeliveryChat({order_type:'delivery',status:'Completed',delivery_chat_opened_at:'2026-10-30T11:00:00Z'}),true)
})
test('tracking links belong only to staff-booked delivery riders',()=>{
  assert.equal(dispatchNeedsTracking({order_type:'delivery',rider_booking:'customer'}),false)
  assert.equal(dispatchNeedsTracking({order_type:'delivery',rider_booking:'staff'}),true)
  assert.equal(dispatchNeedsTracking({order_type:'delivery'}),true)
  assert.equal(dispatchNeedsTracking({order_type:'pickup'}),false)
})
test('deadline display never becomes negative or invents a new hour',()=>{
  assert.equal(deliveryCountdown('2026-10-30T13:00:00Z',now),'60:00')
  assert.equal(deliveryCountdown('2026-10-30T12:00:01Z',now),'00:01')
  assert.equal(deliveryCountdown('2026-10-30T11:00:00Z',now),'00:00')
  assert.equal(deliveryCountdown('invalid',now),'')
})
test('realtime events, optimistic responses and older pages merge once in server order',()=>{
  const initial=[{id:'12',body:'first'},{id:'14',body:'next'}]
  const merged=mergeDeliveryMessages(initial,[{id:'14',body:'next, refreshed'},{id:'13',body:'between'},{id:'9007199254740993',body:'large id'},{id:'9007199254740992',body:'before large id'}])
  assert.deepEqual(merged.map(message=>message.id),['12','13','14','9007199254740992','9007199254740993'])
  assert.equal(merged[2].body,'next, refreshed')
  assert.equal(initial[1].body,'next')
  assert.equal(mergeDeliveryMessages(merged,[merged[2]]).length,5)
})
