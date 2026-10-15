import React from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { RealmPassportBook } from './src/pages/customer/RealmPassportPage'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MemoryRouter>
      <RealmPassportBook
        profile={{ id: 'realm-passport-preview', username: 'meow', birthdate: '1964-10-08', created_at: '2026-10-01' }}
        id="TCR-5032"
        memberKey="realm-passport-preview"
        benefit={{ status: 'approved', kind: 'senior' }}
        orders={Array.from({ length: 7 }, (_, index) => ({
          id: `preview-order-${index}`,
          order_number: `TEST-${index}`,
          status: 'completed',
          created_at: `2026-10-${String(index + 1).padStart(2, '0')}`,
        }))}
      />
    </MemoryRouter>
  </React.StrictMode>,
)
