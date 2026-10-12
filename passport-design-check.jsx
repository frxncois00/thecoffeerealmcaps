import React from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { RealmPassportBook } from './src/pages/customer/RealmPassportPage'
createRoot(document.getElementById('root')).render(<React.StrictMode><MemoryRouter><RealmPassportBook profile={{id:'design-check',username:'meow',birthdate:'1964-10-08',created_at:'2026-10-01'}} id="TCR-5032" memberKey="design-check" benefit={{status:'approved',kind:'senior'}} orders={Array.from({length:7},(_,i)=>({id:`design-order-${i}`,order_number:`TEST-${i}`,status:'completed',created_at:`2026-10-${String(i+1).padStart(2,'0')}`}))}/></MemoryRouter></React.StrictMode>)
