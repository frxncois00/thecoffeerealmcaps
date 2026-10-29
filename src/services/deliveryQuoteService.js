import { customerSupabase } from '../lib/supabase'
import { deliveryQuoteErrorMessage } from '../utils/deliveryQuoteErrors.js'

export async function fetchDeliveryQuote({ coordinates, barangay }) {
  const { data, error } = await customerSupabase.functions.invoke('delivery-quote', { body: { coordinates, barangay } })
  if (error) {
    throw new Error(await deliveryQuoteErrorMessage(error))
  }
  if (!data?.id) throw new Error(data?.error || 'Delivery quote unavailable.')
  return data
}
