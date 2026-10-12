import { customerSupabase } from '../lib/supabase'

// Customer ownership includes cashier orders linked by create_cashier_order_with_passport.
// Keep this lightweight so an open passport can refresh without fetching every line item.
export async function fetchRealmPassportPurchases(userId) {
  const { data, error } = await customerSupabase.from('orders')
    .select('id,order_number,created_at,status,payment_status,refund_status,is_voided,order_type,realm_passport_id')
    .eq('customer_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function ensureRealmId() {
  const { data, error } = await customerSupabase.rpc('ensure_realm_passport')
  if (error) throw error
  if (!/^TCR-\d{4}$/.test(data)) throw new Error('Invalid Realm ID')
  return data
}

export async function fetchRealmPassportClaims() {
  const { data, error } = await customerSupabase
    .from('realm_passport_reward_claims')
    .select('reward_number,claimed_at')
  if (error) throw error
  return data || []
}
