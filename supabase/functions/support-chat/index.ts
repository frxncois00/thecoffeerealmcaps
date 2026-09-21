import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const allowedRoles = new Set(['admin', 'staff', 'operational_staff', 'cashier'])

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const authHeader = request.headers.get('Authorization') || ''
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return json({ error: 'You must be signed in.' }, 401)
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role,full_name,username').eq('id', user.id).maybeSingle()
    if (profileError) throw profileError
    const role = String(profile?.role || '').toLowerCase().replace(/\s+/g, '_')
    if (!allowedRoles.has(role)) return json({ error: 'Raimu is only available to internal users.' }, 403)
    const body = await request.json()
    const message = String(body?.message || '').trim()
    if (!message || message.length > 1000) return json({ error: 'Enter a message up to 1,000 characters.' }, 400)
    const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_AI_API_KEY')
    if (!apiKey) return json({ error: 'Gemini is not configured in Supabase Secrets.' }, 503)
    const prompt = `You are Raimu, the internal support assistant for The Coffee Realm. The signed-in user role is ${role}. Answer clearly and briefly. Never invent live business numbers, and do not claim to have performed actions. If the user asks for live sales, inventory, order, payment, or report data, explain that the approved database tools are being connected and ask a concise clarifying question if needed. User message: ${message}`
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 300 } }) })
    const result = await response.json()
    if (!response.ok) return json({ error: result?.error?.message || 'Gemini could not answer right now.' }, 502)
    const text = result?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('').trim()
    return json({ text: text || 'I could not generate a response yet.' })
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Support request failed.' }, 500) }
})

function json(body: Record<string, unknown>, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } }) }
