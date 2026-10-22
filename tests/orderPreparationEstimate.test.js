import test from 'node:test'
import assert from 'node:assert/strict'
import {orderPreparationRange,cartPreparationRange} from '../src/utils/orderPreparationEstimate.js'
const made=(minutes,quantity)=>({quantity,menu_items:{prep_time_minutes:minutes,item_type:'drink'}})
test('quantities scale beyond five units',()=>{
assert.deepEqual(orderPreparationRange({order_items:[made(5,10)]}),{min:50,max:55})
assert.deepEqual(orderPreparationRange({order_items:[made(5,20)]}),{min:100,max:105})
})
test('mixed work accumulates and splitting lines preserves estimates',()=>{
assert.deepEqual(orderPreparationRange({order_items:[made(5,2),made(10,3)]}),{min:40,max:45})
assert.deepEqual(orderPreparationRange({order_items:[made(5,2)]}),orderPreparationRange({order_items:[made(5,1),made(5,1)]}))
})
test('cart metadata and fallback timing',()=>{
assert.deepEqual(cartPreparationRange([{productId:'a',quantity:10}],[{id:'a',prep_time_minutes:5}]),{min:50,max:55})
assert.deepEqual(orderPreparationRange({order_items:[{quantity:3}]}),{min:30,max:35})
assert.equal(orderPreparationRange({order_items:[]}),null)
})
