import test from 'node:test'
import assert from 'node:assert/strict'
import { DELIVERY_DEFAULTS, calculateDeliveryFee, validateDeliveryRates } from '../supabase/functions/delivery-quote/pricing.mjs'

test('progressive delivery rates charge each distance tier once',()=>{
  assert.equal(calculateDeliveryFee(0,DELIVERY_DEFAULTS),50)
  assert.equal(calculateDeliveryFee(3,DELIVERY_DEFAULTS),69.5)
  assert.equal(calculateDeliveryFee(4.2,DELIVERY_DEFAULTS),76.94)
  assert.equal(calculateDeliveryFee(7,DELIVERY_DEFAULTS),94.3)
  assert.equal(calculateDeliveryFee(10,DELIVERY_DEFAULTS),112.3)
})
test('unconfigured distances fail closed; admin rate changes apply',()=>{
  assert.throws(()=>calculateDeliveryFee(10.1,DELIVERY_DEFAULTS),/unavailable/)
  assert.throws(()=>calculateDeliveryFee(16,DELIVERY_DEFAULTS),/unavailable/)
  const configured={...DELIVERY_DEFAULTS,tiers:DELIVERY_DEFAULTS.tiers.map(t=>({...t,rate:t.rate??5.5}))}
  assert.equal(calculateDeliveryFee(16,configured),144.8)
  assert.equal(calculateDeliveryFee(3,{...configured,baseFare:60}),79.5)
})
test('invalid, missing, and overlapping rates cannot produce a quote',()=>{
  for(const value of [-1,NaN,Infinity,201])assert.throws(()=>calculateDeliveryFee(value,DELIVERY_DEFAULTS))
  assert.throws(()=>validateDeliveryRates({...DELIVERY_DEFAULTS,baseFare:-1}))
  assert.throws(()=>validateDeliveryRates({...DELIVERY_DEFAULTS,tiers:[{upTo:5,rate:2},{upTo:4,rate:3},{upTo:null,rate:3}]}))
  assert.throws(()=>validateDeliveryRates({...DELIVERY_DEFAULTS,tiers:[{upTo:5,rate:2}]}))
})
