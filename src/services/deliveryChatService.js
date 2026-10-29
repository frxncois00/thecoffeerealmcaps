import { customerSupabase, supabase } from '../lib/supabase'
import { validateImageFile } from '../utils/imageUpload.js'
import { DELIVERY_PROOF_LIMIT } from '../utils/deliveryChat.js'

export const deliveryChatClient = role => role === 'customer' ? customerSupabase : supabase

export async function listDeliveryChats(role) {
  const { data, error } = await deliveryChatClient(role).rpc('list_delivery_chats')
  if (error) throw error
  return data || []
}

export async function fetchDeliveryMessages(role, orderId, { before, after } = {}) {
  let query = deliveryChatClient(role).from('delivery_chat_messages').select('*').eq('order_id', orderId)
  if (before != null) query = query.lt('id', before)
  if (after != null) query = query.gt('id', after)
  const { data, error } = await query.order('id', { ascending: after != null }).limit(100)
  if (error) throw error
  return after != null ? data || [] : (data || []).reverse()
}

export async function sendDeliveryMessage(role, orderId, body, clientKey) {
  const { data, error } = await deliveryChatClient(role).rpc('send_delivery_chat_message', { p_order_id: orderId, p_body: body, p_client_key: clientKey })
  if (error) throw error
  return data
}

export async function markDeliveryChatRead(role, orderId, lastId) {
  const { error } = await deliveryChatClient(role).rpc('mark_delivery_chat_read', { p_order_id: orderId, p_last_id: lastId })
  if (error) throw error
}

export async function getDeliveryProofUrls(role, paths) {
  if (!paths?.length) return []
  const { data, error } = await deliveryChatClient(role).storage.from('delivery-proofs').createSignedUrls(paths, 3600)
  if (error) throw error
  if (data.some(file => file.error || !file.signedUrl)) throw new Error('Could not load delivery images. Reopen the chat to retry.')
  return data.map(file => ({ path: file.path, url: file.signedUrl }))
}

export async function dispatchDelivery(orderId, trackingUrl) {
  const { data, error } = await supabase.rpc('staff_dispatch_delivery', { p_order_id: orderId, p_tracking_url: trackingUrl || null })
  if (error) throw error
  return data
}

export async function submitDeliveryProof(orderId, files) {
  if (files.length > DELIVERY_PROOF_LIMIT) throw new Error('Upload up to 3 images.')
  const validated = []
  for (const file of files) validated.push({ file, ...await validateImageFile(file, { label: 'Delivery proof' }) })
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError || !auth.user) throw new Error('Sign in again to confirm delivery.')
  const uploaded = []
  try {
    for (const { file, extension } of validated) {
      const path = `${orderId}/${auth.user.id}/${crypto.randomUUID()}.${extension}`
      const { error } = await supabase.storage.from('delivery-proofs').upload(path, file, { contentType: file.type, upsert: false })
      if (error) throw error
      uploaded.push(path)
    }
    const { data, error } = await supabase.rpc('staff_confirm_delivery', { p_order_id: orderId, p_attachment_paths: uploaded })
    if (error) throw error
    const unused = uploaded.filter(path => !(data.attachment_paths || []).includes(path))
    if (unused.length) await supabase.storage.from('delivery-proofs').remove(unused).catch(() => {})
    return data
  } catch (error) {
    // Storage policy preserves any files already attached by a committed RPC.
    if (uploaded.length) await supabase.storage.from('delivery-proofs').remove(uploaded).catch(() => {})
    throw error
  }
}
