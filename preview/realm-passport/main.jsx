import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { RealmPassportBook } from '../../src/pages/customer/RealmPassportPage'
import { completedPassportOrders } from '../../src/utils/realmPassport'
import '../../src/styles.css'

const params = new URLSearchParams(window.location.search)
const requestedCount = Number(params.get('count') ?? 12)
const initialCount = Number.isFinite(requestedCount) ? Math.max(0, Math.min(1000, Math.floor(requestedCount))) : 12
const member = params.get('member') || 'cozybean'
const memberKey = `preview:${member}`

function PassportPreview() {
  const [count, setCount] = useState(initialCount)
  const [state, setState] = useState(params.get('state') || 'ready')
  const profile = state === 'missing' ? { id: memberKey, username: 'newmember' } : {
    id: memberKey,
    username: state === 'long' ? 'thecoffeerealmregularwithanextraordinarilylongusername' : 'cozybean',
    birthdate: '1998-04-12',
    created_at: '2026-01-15',
    favorite_drink: state === 'long' ? 'Extra creamy iced Biscoff latte with oat milk, espresso, caramel drizzle and cinnamon' : 'Biscoff Latte',
    favorite_food: state === 'long' ? 'Slow cooked beef tapa with garlic rice, two eggs, fresh tomatoes and homemade pickled vegetables' : 'Beef Tapa',
  }
  const orders = completedPassportOrders(Array.from({ length: count }, (_, index) => ({
    id: `${memberKey}-order-${index + 1}`,
    order_number: `TCR-${String(index + 1).padStart(4, '0')}`,
    status: 'Completed',
    created_at: new Date(Date.UTC(2026, 7, 1 + index, 8)).toISOString(),
  })))
  return <>
    {params.get('controls') === '1' && <div className="passport-preview-controls" aria-label="Preview scenarios">
      <span>{count} completed orders</span>
      <button onClick={() => setCount(value => value + 1)}>Add completed order</button>
      <button onClick={() => setState('loading')}>Loading</button>
      <button onClick={() => setState('error')}>Error</button>
      <button onClick={() => setState('ready')}>Ready</button>
    </div>}
    <RealmPassportBook
      id="TCR-4827"
      memberKey={memberKey}
      profile={profile}
      orders={orders}
      benefit={state === 'missing' ? null : { status: 'approved', kind: params.get('benefit') === 'senior' ? 'senior' : 'pwd' }}
      loading={state === 'loading'}
      purchasesUnavailable={state === 'error'}
      errors={state === 'error' ? ['Your purchase history could not be loaded. Please try again.'] : []}
      retry={() => setState('ready')}
    />
  </>
}

createRoot(document.getElementById('root')).render(<BrowserRouter><PassportPreview/></BrowserRouter>)
