import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const allowedRoles = new Set(['admin', 'staff', 'cashier'])

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const authHeader = request.headers.get('Authorization') || ''
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return json({ error: 'You must be signed in.' }, 401)
    const dataClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!)
    const { data: profile, error: profileError } = await dataClient.from('profiles').select('role,full_name,username').eq('id', user.id).maybeSingle()
    if (profileError) throw profileError
    const role = String(profile?.role || '').toLowerCase().replace(/\s+/g, '_')
    if (!allowedRoles.has(role)) return json({ error: 'Raimu is only available to internal users.' }, 403)
    const body = await request.json()
    const message = String(body?.message || '').trim()
    if (!message || message.length > 1000) return json({ error: 'Enter a message up to 1,000 characters.' }, 400)
    const lowerMessage = message.toLowerCase()
    const profileName = String(profile?.full_name || profile?.username || user.email?.split('@')[0] || '').trim()
    if (lowerMessage.includes('what is my name') || lowerMessage.includes("what's my name") || lowerMessage.includes('who am i')) {
      return json({ text: profileName ? `Your name is ${profileName}.` : 'I do not have your name saved in your profile yet.', provider: 'workspace' })
    }
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)[!. ]*$/i.test(message)) {
      return json({ text: `Hello! I'm Raimu, your internal support assistant for The Coffee Realm. How can I help you today?`, provider: 'instant' })
    }
    if (lowerMessage.includes('what can you do') || lowerMessage.includes('what do you do') || lowerMessage.includes('how can you help')) {
      return json({ text: `I can help with menu information, orders, inventory, sales summaries, payments, customer concerns, and internal reports. What would you like to check?`, provider: 'instant' })
    }
    const geminiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_AI_API_KEY') || Deno.env.get('support-chat')
    const groqKey = Deno.env.get('GROQ_API_KEY')
    const cloudflareToken = Deno.env.get('CLOUDFLARE_API_TOKEN')
    const cloudflareAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
    if (!geminiKey && !groqKey && !(cloudflareToken && cloudflareAccountId)) return json({ error: 'No AI provider is configured in Supabase Secrets.' }, 503)
    const context: Record<string, unknown> = { store: 'The Coffee Realm', user_name: profileName || undefined, role, allowed_actions: ['read approved operational information'] }
    const lower = lowerMessage
    if (lower.includes('menu') || lower.includes('price') || lower.includes('available') || lower.includes('product')) {
      const { data } = await dataClient.from('menu_items').select('name,price,is_available,manual_available').eq('is_archived', false).order('name').limit(100)
      context.menu = data || []
    }
    if (['admin', 'staff'].includes(role) && (lower.includes('sale') || lower.includes('revenue') || lower.includes('payment'))) {
      const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0)
      const { data } = await dataClient.from('orders').select('final_total,status,payment_status,is_voided,created_at').gte('created_at', start.toISOString()).limit(1000)
      const orders = data || []
      const counted = orders.filter((order) => ['Completed', 'Received'].includes(String(order.status)) && String(order.payment_status).toLowerCase() === 'paid' && !order.is_voided)
      const netSales = counted.reduce((sum, order) => sum + Number(order.final_total || 0), 0)
      context.month_to_date_orders = { order_count: counted.length, net_sales: netSales }
      if (lower.includes('net') && counted.length >= 0) {
        return json({ text: `Net sales for this month are ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(netSales)} across ${counted.length} paid completed orders.`, provider: 'workspace' })
      }
    }
    if (['admin', 'staff', 'cashier'].includes(role) && (lower.includes('latest transaction') || lower.includes('recent transaction') || lower.includes('last transaction'))) {
      const { data } = await dataClient.from('orders').select('order_number,final_total,status,payment_status,created_at').order('created_at', { ascending: false }).limit(1)
      const latest = data?.[0]
      if (!latest) return json({ text: 'I could not find any transactions yet.', provider: 'workspace' })
      return json({ text: `The latest transaction is order ${latest.order_number || 'unassigned'}, ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(latest.final_total || 0))}, status ${latest.status || 'unknown'}, payment ${latest.payment_status || 'unknown'}, recorded ${new Date(latest.created_at).toLocaleString('en-PH')}.`, provider: 'workspace' })
    }
    if (['admin', 'staff', 'cashier'].includes(role) && !lower.includes('export') && !lower.includes('generate') && !lower.includes('create') && (lower.includes('transaction history') || lower.includes('transaction list') || lower.includes('recent transactions'))) {
      const { data } = await dataClient.from('orders').select('order_number,final_total,status,payment_status,created_at').order('created_at', { ascending: false }).limit(10)
      if (!data?.length) return json({ text: 'I could not find any transactions yet.', provider: 'workspace' })
      const lines = data.map((order) => `• ${order.order_number || 'Unassigned'} — ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(order.final_total || 0))} — ${order.status || 'unknown'} — ${new Date(order.created_at).toLocaleDateString('en-PH')}`)
      return json({ text: `Here are the 10 most recent transactions:\n${lines.join('\n')}`, provider: 'workspace' })
    }
    if (['admin', 'staff', 'cashier'].includes(role) && lower.includes('receipt')) {
      const orderNumber = message.match(/CR[-\s]?\d{4}[-\s]?\d{4}/i)?.[0]?.replace(/\s/g, '-')
      if (!orderNumber) return json({ text: 'Please provide the order number, for example CR-0920-0131, so I can generate the receipt.', provider: 'workspace' })
      const { data: orders } = await dataClient.from('orders').select('order_number,customer_name,order_type,final_total,status,payment_status,created_at,order_items(item_name,display_name,quantity,unit_price,line_total)').eq('order_number', orderNumber).limit(1)
      const order = orders?.[0]
      if (!order) return json({ text: `I could not find order ${orderNumber}.`, provider: 'workspace' })
      const rows = (order.order_items?.length ? order.order_items : [{ item_name: 'Order total', quantity: 1, unit_price: order.final_total, line_total: order.final_total }]).map((item) => [order.order_number, order.customer_name || 'Walk-in customer', order.order_type || '', item.display_name || item.item_name || 'Item', item.quantity, item.unit_price, item.line_total, order.status, order.payment_status, order.created_at])
      const url = await uploadReport(dataClient, user.id, `receipt-${order.order_number}`, ['Order number', 'Customer', 'Order type', 'Item', 'Quantity', 'Unit price', 'Line total', 'Order status', 'Payment status', 'Created at'], rows)
      return json({ text: `Receipt for ${order.order_number} is ready: ${url}`, provider: 'workspace', download_url: url })
    }
    if (lower.includes('generate') || lower.includes('export') || lower.includes('create')) {
      const wantsSales = lower.includes('sales') || lower.includes('revenue')
      const wantsInventory = lower.includes('inventory') || lower.includes('stock')
      const wantsTransactions = lower.includes('transaction') || lower.includes('payment')
      const wantsWalkIns = lower.includes('walk-in') || lower.includes('walk in')
      if ((wantsSales && ['admin', 'staff'].includes(role)) || ((wantsTransactions || wantsWalkIns) && ['admin', 'staff', 'cashier'].includes(role))) {
        let query = dataClient.from('orders').select('order_number,order_type,final_total,status,payment_status,created_at').order('created_at', { ascending: false }).limit(1000)
        if (wantsWalkIns) query = query.eq('order_type', 'walk-in')
        const { data } = await query
        const rows = (data || []).map((order) => [order.order_number, order.final_total, order.status, order.payment_status, order.created_at])
        const reportLabel = wantsWalkIns ? 'walk-in orders' : wantsSales ? 'sales' : 'transaction'
        const url = await uploadReport(dataClient, user.id, wantsWalkIns ? 'walk-in-orders-report' : wantsSales ? 'sales-report' : 'transaction-report', ['Order number', 'Amount', 'Status', 'Payment status', 'Created at'], rows)
        return json({ text: `Your ${reportLabel} report is ready: ${url}`, provider: 'workspace', download_url: url })
      }
      if (wantsInventory && ['admin', 'staff'].includes(role)) {
        const { data } = await dataClient.from('ingredients').select('name,unit,is_archived,inventory_stock(quantity,min_stock_level)').eq('is_archived', false).limit(500)
        const rows = (data || []).map((item) => [item.name, item.unit, item.inventory_stock?.[0]?.quantity ?? '', item.inventory_stock?.[0]?.min_stock_level ?? ''])
        const url = await uploadReport(dataClient, user.id, 'inventory-report', ['Ingredient', 'Unit', 'Quantity', 'Minimum stock'], rows)
        return json({ text: `Your inventory report is ready: ${url}`, provider: 'workspace', download_url: url })
      }
    }
    if (['admin', 'staff'].includes(role) && (lower.includes('stock') || lower.includes('inventory') || lower.includes('ingredient'))) {
      const { data } = await dataClient.from('ingredients').select('name,unit,is_archived,inventory_stock(quantity,min_stock_level)').eq('is_archived', false).limit(200)
      context.inventory = data || []
    }
    if (['admin', 'staff'].includes(role) && (lower.includes('report') || lower.includes('complaint') || lower.includes('concern'))) {
      const { data } = await dataClient.from('customer_messages').select('id,category,subject,status,created_at').order('created_at', { ascending: false }).limit(50)
      context.customer_reports = data || []
    }
    const prompt = `You are Raimu, the internal support assistant for The Coffee Realm. The signed-in user role is ${role}. Answer clearly and briefly using only the verified workspace context below. Never invent numbers. Do not claim an action was completed unless the backend confirms it. Do not reveal data outside the user's role. If the context does not contain the answer, say what is missing and ask a concise follow-up question. Workspace context: ${JSON.stringify(context)} User message: ${message}`
    const fallbackPrompt = `You are Raimu, the internal support assistant for The Coffee Realm. The signed-in user role is ${role}. Answer this general question naturally and briefly. You do not have access to live store data, so never invent sales, order, payment, inventory, customer, or account information. If the user asks for live or private data, explain that the primary data service is temporarily unavailable and ask them to try again shortly. User message: ${message}`
    const providerErrors: string[] = []
    let text = ''
    let provider = ''

    if (groqKey) {
      const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'openai/gpt-oss-20b', messages: [{ role: 'user', content: prompt }], temperature: 0.2, max_tokens: 180 }) })
      const result = await response.json()
      if (response.ok) {
        text = String(result?.choices?.[0]?.message?.content || '').trim()
        provider = 'groq'
      } else providerErrors.push(`Groq: ${result?.error?.message || response.status}`)
    }

    if (!text && cloudflareToken && cloudflareAccountId) {
      const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(cloudflareAccountId)}/ai/run/@cf/meta/llama-3.1-8b-instruct`
      const response = await fetchWithTimeout(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${cloudflareToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, max_tokens: 180 }) })
      const result = await response.json()
      if (response.ok && result?.success !== false) {
        text = String(result?.result?.response || '').trim()
        provider = 'cloudflare'
      } else providerErrors.push(`Cloudflare: ${result?.errors?.[0]?.message || response.status}`)
    }

    if (!text && geminiKey) {
      const requestBody = JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 180 } })
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(geminiKey)}`
      let response = await fetchWithTimeout(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requestBody })
      if (response.status === 429 || response.status === 503) {
        await new Promise((resolve) => setTimeout(resolve, 450))
        response = await fetchWithTimeout(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requestBody })
      }
      const result = await response.json()
      if (response.ok) {
        text = result?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('').trim() || ''
        provider = 'gemini'
      } else providerErrors.push(`Gemini: ${result?.error?.message || response.status}`)
    }

    if (!text) return json({ error: providerErrors.join(' | ') || 'All AI providers are temporarily unavailable.' }, 502)
    return json({ text, provider })
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Support request failed.' }, 500) }
})

function json(body: Record<string, unknown>, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } }) }

async function uploadReport(client: ReturnType<typeof createClient>, userId: string, prefix: string, headers: string[], rows: unknown[][]) {
  const bucket = 'raimu-reports'
  await client.storage.createBucket(bucket, { public: false }).catch(() => {})
  const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
  const path = `${userId}/${prefix}-${Date.now()}.csv`
  const { error } = await client.storage.from(bucket).upload(path, new Blob([csv], { type: 'text/csv;charset=utf-8' }), { contentType: 'text/csv', upsert: false })
  if (error) throw error
  const { data, error: signedError } = await client.storage.from(bucket).createSignedUrl(path, 3600)
  if (signedError || !data?.signedUrl) throw signedError || new Error('Could not create a report download link.')
  return data.signedUrl
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try { return await fetch(input, { ...init, signal: controller.signal }) } finally { clearTimeout(timeout) }
}
