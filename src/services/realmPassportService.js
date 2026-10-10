import { customerSupabase } from '../lib/supabase'

export async function ensureRealmId() {
  const { data, error } = await customerSupabase.rpc('ensure_realm_passport')
  if (error) throw error
  if (!/^TCR-\d{4}$/.test(data)) throw new Error('Invalid Realm ID')
  return data
}
