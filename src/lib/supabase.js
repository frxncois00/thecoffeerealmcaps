import { createClient } from '@supabase/supabase-js'

const fallbackUrl = 'https://jhkkocjbamoybdvcvoaa.supabase.co'
const fallbackAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoa2tvY2piYW1veWJkdmN2b2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODA3MzgsImV4cCI6MjEwMDM1NjczOH0.izmJt-CBjlmSr-fl-ryobfM-5GC-PrDqce1NJF_v0RI'

console.info('[Supabase config] startup ' + JSON.stringify({
  envUrlPresent: Boolean(import.meta.env.VITE_SUPABASE_URL?.trim()),
  envAnonKeyPresent: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()),
  usingFallbackUrl: !import.meta.env.VITE_SUPABASE_URL?.trim(),
  usingFallbackAnonKey: !import.meta.env.VITE_SUPABASE_ANON_KEY?.trim(),
}))

const url = import.meta.env.VITE_SUPABASE_URL || fallbackUrl
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackAnonKey

const makeClient = (storageKey, detectSessionInUrl = false) => url && anonKey ? createClient(url, anonKey, {
  auth: {
    storageKey,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl,
  },
}) : null

export const portalSupabase = makeClient('coffee-realm-portal-auth')
export const customerSupabase = makeClient('coffee-realm-customer-auth', true)

// Existing internal services keep using this export. Customer-facing modules
// import customerSupabase explicitly so the two sessions cannot overwrite one another.
export const supabase = portalSupabase
export const isSupabaseConfigured = Boolean(portalSupabase && customerSupabase)
