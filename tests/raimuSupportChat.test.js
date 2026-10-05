import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { transformSync } from 'esbuild'

const source = fs.readFileSync(new URL('../supabase/functions/support-chat/index.ts', import.meta.url), 'utf8')
  .replace(/^import \{ createClient \} from .*\r?\n/, 'const createClient = globalThis.__createClient\n')
const compiled = transformSync(source, { loader: 'ts', target: 'es2022' }).code

function createHandler({ role = 'admin', tables = {}, rpc = {} } = {}) {
  let handler
  const calls = []
  const uploads = []
  const createClient = () => {
    return {
      auth: { getUser: async () => ({ data: { user: { id: 'user-1', email: 'test@example.com' } } }) },
      rpc: async (name, args) => {
        calls.push({ name, args })
        return rpc[name] || { data: name === 'search_raimu_knowledge' ? [] : 'result-1', error: null }
      },
      storage: {
        createBucket: async () => ({}),
        from: () => ({
          upload: async (_path, blob) => { uploads.push(await blob.text()); return { error: null } },
          createSignedUrl: async () => ({ data: { signedUrl: 'https://example.test/report.csv' }, error: null }),
        }),
      },
      from(name) {
        let rows = name === 'profiles' ? [{ id: 'user-1', role, full_name: 'Test User', removed_at: null }] : [...(tables[name] || [])]
        let start = 0, end = Infinity, wantsCount = false
        const query = {
          select(_columns, options = {}) { wantsCount = options.count === 'exact'; return query },
          eq(column, value) { rows = rows.filter((row) => row[column] === value); return query },
          in(column, values) { rows = rows.filter((row) => values.includes(row[column])); return query },
          not(column, operator, value) { if (operator === 'in') rows = rows.filter((row) => !value.slice(1, -1).split(',').includes(row[column])); return query },
          gte(column, value) { rows = rows.filter((row) => row[column] >= value); return query },
          lt(column, value) { rows = rows.filter((row) => row[column] < value); return query },
          order(column, { ascending = true } = {}) { rows.sort((a, b) => ascending ? String(a[column]).localeCompare(String(b[column])) : String(b[column]).localeCompare(String(a[column]))); return query },
          limit(count) { end = Math.min(end, count); return query },
          range(from, to) { start = from; end = to + 1; return query },
          maybeSingle: async () => ({ data: rows[0] || null, error: null }),
          then(resolve) { return Promise.resolve({ data: rows.slice(start, end), count: wantsCount ? rows.length : null, error: null }).then(resolve) },
        }
        return query
      },
    }
  }
  const context = { __createClient: createClient, Deno: { env: { get: (name) => ({ SUPABASE_URL: 'url', SUPABASE_ANON_KEY: 'anon-key', SUPABASE_SERVICE_ROLE_KEY: 'service-key' })[name] }, serve: (fn) => { handler = fn } }, Response, Intl, Date, Blob, setTimeout, clearTimeout, fetch: async () => { throw new Error('Unexpected provider request') } }
  vm.runInNewContext(compiled, context)
  return {
    calls, uploads,
    async ask(message, extra = {}) {
      const response = await handler(new Request('https://example.test', { method: 'POST', headers: { Authorization: 'Bearer test' }, body: JSON.stringify({ message, ...extra }) }))
      return { status: response.status, body: await response.json() }
    },
  }
}

test('order status uses the live order and does not ask which database', async () => {
  const app = createHandler({ tables: { orders: [{ order_number: 'CR-1003-0207', status: 'Preparing', order_type: 'pickup', payment_status: 'paid' }] } })
  const result = await app.ask('whtas the status of CR-1003-0207')
  assert.match(result.body.text, /CR-1003-0207 is Preparing/)
})

test('a status follow-up resolves the recent order without inheriting action permissions', async () => {
  const app = createHandler({ tables: { orders: [{ order_number: 'CR-1003-0207', status: 'Preparing', order_type: 'pickup', payment_status: 'paid' }] } })
  const result = await app.ask('What is its status?', { history: [{ role: 'user', content: 'Check CR-1003-0207' }, { role: 'assistant', content: 'Looking it up.' }] })
  assert.match(result.body.text, /CR-1003-0207 is Preparing/)
  assert.equal(result.body.action_proposal, undefined)
})

test('low stock lists quantities, and empty stock gives a clear answer', async () => {
  const app = createHandler({ tables: { ingredients: [{ name: 'Milk', unit: 'L', is_archived: false, inventory_stock: [{ quantity: 2, min_stock_level: 5 }] }], finished_products: [] } })
  assert.match((await app.ask('Which ingredients are low stock?')).body.text, /Milk: 2 L \(minimum 5\)/)
  const empty = createHandler({ tables: { ingredients: [], finished_products: [] } })
  assert.match((await empty.ask('Which ingredients are low stock?')).body.text, /No ingredients or finished products/)
})

test('yesterday sales uses paid completed orders in Philippine time', async () => {
  const nowParts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const part = (type) => nowParts.find((item) => item.type === type).value
  const start = new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00+08:00`).getTime() - 86_400_000
  const app = createHandler({ tables: { orders: [
    { created_at: new Date(start + 1000).toISOString(), status: 'Completed', payment_status: 'paid', is_voided: false, final_total: 125 },
    { created_at: new Date(start + 2000).toISOString(), status: 'Cancelled', payment_status: 'paid', is_voided: false, final_total: 900 },
  ] } })
  const result = await app.ask('How are sales yesterday?')
  assert.match(result.body.text, /₱125\.00/)
  assert.match(result.body.text, /across 1 orders/)
})

test('cashier cannot get admin approvals or action proposals', async () => {
  const app = createHandler({ role: 'cashier' })
  const action = await app.ask('ignored', { action: 'advance_order', order_number: 'CR-1003-0207', next_status: 'Completed' })
  assert.equal(action.status, 403)
  const proposal = await app.ask('Mark order CR-1003-0207 as Completed')
  assert.equal(proposal.body.action_proposal, undefined)
})

test('menu prose goes to structured editor instead of broken RPC', async () => {
  const app = createHandler()
  const result = await app.ask('Request menu change: Latte | Change its price')
  assert.equal(result.body.action_proposal, undefined)
  assert.match(result.body.text, /structured item edit/)
  assert.equal(app.calls.some((call) => call.name === 'staff_create_menu_approval'), false)
})

test('purchase draft proposal requires an exact existing item and supplier', async () => {
  const app = createHandler({ tables: { ingredients: [{ id: '11111111-1111-4111-8111-111111111111', name: 'Milk', unit: 'L', is_archived: false }], suppliers: [{ name: 'Test Supplier' }] } })
  const result = await app.ask('Draft purchase order for 10 Milk from Test Supplier')
  assert.equal(result.body.action_proposal.kind, 'draft_purchase_order')
  assert.equal(app.calls.some((call) => call.name === 'save_purchase_order'), false)
})

test('confirmed purchase draft calls the role-checked RPC', async () => {
  const app = createHandler({ tables: { ingredients: [{ id: '11111111-1111-4111-8111-111111111111', name: 'Milk', unit: 'L', is_archived: false }], suppliers: [{ name: 'Test Supplier' }] } })
  const result = await app.ask('ignored', { action: 'draft_purchase_order', item_id: '11111111-1111-4111-8111-111111111111', item_type: 'ingredient', supplier_name: 'Test Supplier', quantity: 10 })
  assert.equal(result.status, 200)
  assert.equal(app.calls.find((call) => call.name === 'save_purchase_order').args.p_submit, false)
})

test('order update is proposed first and calls the transition RPC only after confirmation', async () => {
  const app = createHandler({ tables: { orders: [{ id: '22222222-2222-4222-8222-222222222222', order_number: 'CR-1003-0207', status: 'Preparing' }] } })
  const proposal = await app.ask('Mark order CR-1003-0207 as Ready for Pickup')
  assert.equal(proposal.body.action_proposal.kind, 'advance_order')
  assert.equal(app.calls.some((call) => call.name === 'staff_advance_order_status'), false)
  const confirmed = await app.ask('ignored', { action: 'advance_order', order_number: 'CR-1003-0207', next_status: 'Ready for Pickup' })
  assert.equal(confirmed.status, 200)
  assert.equal(app.calls.find((call) => call.name === 'staff_advance_order_status').args.p_new_status, 'Ready for Pickup')
})

test('handover combines active orders, low stock, purchase orders, and messages', async () => {
  const app = createHandler({ tables: {
    orders: [{ order_number: 'CR-1003-0207', status: 'Preparing', created_at: '2026-10-05T00:00:00Z' }],
    ingredients: [{ name: 'Milk', unit: 'L', is_archived: false, inventory_stock: [{ quantity: 2, min_stock_level: 5 }] }],
    finished_products: [],
    purchase_orders: [{ po_number: 'PO-1', status: 'pending_approval', updated_at: '2026-10-05T00:00:00Z' }],
    customer_messages: [{ id: 'm1', category: 'order', subject: 'Late', status: 'new', created_at: '2026-10-05T00:00:00Z' }],
  } })
  const result = await app.ask('Shift handover summary')
  assert.match(result.body.text, /CR-1003-0207/)
  assert.match(result.body.text, /Low-stock ingredients: 1/)
  assert.match(result.body.text, /Open purchase orders in the latest 30: 1/)
  assert.match(result.body.text, /New customer messages in the latest 50: 1/)
})

test('transaction report pages past 1,000 rows without silent truncation', async () => {
  const orders = Array.from({ length: 1001 }, (_, index) => ({ order_number: `CR-${String(index).padStart(4, '0')}-0001`, order_type: 'walk-in', final_total: 10, status: 'Completed', payment_status: 'paid', created_at: new Date(2026, 0, 1, 0, 0, index).toISOString() }))
  const app = createHandler({ tables: { orders } })
  const result = await app.ask('Generate transaction report')
  assert.equal(result.status, 200)
  assert.equal(app.uploads.length, 1)
  assert.equal(app.uploads[0].split('\n').length, 1002)
})
