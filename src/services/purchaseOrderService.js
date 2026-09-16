import { supabase } from '../lib/supabase'
import { fetchFinishedProducts, fetchIngredients } from './opsInventoryService'

export const PURCHASE_ORDER_STATUSES = [
  'draft', 'pending_approval', 'approved', 'rejected', 'sent',
  'partially_received', 'received', 'disputed', 'closed', 'cancelled',
]

export async function fetchPurchaseOrders() {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*,created_by_profile:profiles!purchase_orders_created_by_fkey(full_name),purchase_order_items(*),purchase_order_events(id,from_status,to_status,action,note,created_by,created_at,profiles(full_name))')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data || []).map(normalizePurchaseOrder)
}

export async function fetchPurchaseOrderOptions() {
  const [ingredients, products] = await Promise.all([fetchIngredients(), fetchFinishedProducts()])
  return [
    ...ingredients.map((item) => ({ id: item.id, itemType: 'ingredient', name: item.name, unit: item.unit, quantity: item.quantity, minStockLevel: item.minStockLevel, highStockLevel: item.highStockLevel, supplier: item.supplier || '' })),
    ...products.map((item) => ({ id: item.id, itemType: 'finished_product', name: item.name, unit: item.unit, quantity: item.quantity, minStockLevel: item.minStockLevel, highStockLevel: item.highStockLevel, supplier: item.supplier || '' })),
  ].sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchSuppliers() {
  const { data, error } = await supabase.from('suppliers').select('id,name,contact,supplier_items(item_type,ingredient_id,finished_product_id)').order('name')
  if (error) return []
  return (data || []).map((supplier) => ({ ...supplier, items: supplier.supplier_items || [] }))
}

export async function saveSupplier(payload) {
  const { data, error } = await supabase.rpc('save_supplier', {
    p_name: payload.name,
    p_contact: payload.contact || null,
    p_items: payload.items.map((item) => ({ item_type: item.itemType, item_id: item.id })),
  })
  if (error) throw error
  return data
}

export async function savePurchaseOrder(payload) {
  const { data, error } = await supabase.rpc('save_purchase_order', {
    p_id: payload.id || null,
    p_supplier_name: payload.supplierName,
    p_supplier_contact: payload.supplierContact || null,
    p_requested_delivery_date: payload.requestedDeliveryDate || null,
    p_reason: payload.reason || null,
    p_notes: payload.notes || null,
    p_items: payload.items.map((item) => ({
      item_type: item.itemType,
      item_id: item.itemId,
      quantity_ordered: Number(item.quantityOrdered),
      estimated_unit_cost: Number(item.estimatedUnitCost || 0),
    })),
    p_submit: Boolean(payload.submit),
  })
  if (error) throw error
  return data
}

export async function approvePurchaseOrder(id, approved, reason = '') {
  const { error } = await supabase.rpc('approve_purchase_order', { p_id: id, p_approved: approved, p_reason: reason || null })
  if (error) throw error
}

export async function markPurchaseOrderSent(id, supplierReference = '') {
  const { error } = await supabase.rpc('mark_purchase_order_sent', { p_id: id, p_supplier_reference: supplierReference || null })
  if (error) throw error
}

export async function receivePurchaseOrder(id, lines, receivingNotes = '') {
  const { error } = await supabase.rpc('receive_purchase_order', {
    p_id: id,
    p_lines: lines.map((line) => ({
      id: line.id,
      received_quantity: Number(line.receivedQuantity || 0),
      accepted_quantity: Number(line.acceptedQuantity || 0),
      damaged_quantity: Number(line.damagedQuantity || 0),
      missing_quantity: Number(line.missingQuantity || 0),
      actual_unit_cost: line.actualUnitCost === '' ? null : Number(line.actualUnitCost),
      batch_number: line.batchNumber || null,
      expiration_date: line.expirationDate || null,
      receiving_notes: line.receivingNotes || null,
    })),
    p_receiving_notes: receivingNotes || null,
  })
  if (error) throw error
}

export async function closePurchaseOrder(id, notes = '') {
  const { error } = await supabase.rpc('close_purchase_order', { p_id: id, p_notes: notes || null })
  if (error) throw error
}

export async function cancelPurchaseOrder(id, reason = '') {
  const { error } = await supabase.rpc('cancel_purchase_order', { p_id: id, p_reason: reason || null })
  if (error) throw error
}

function normalizePurchaseOrder(row) {
  return {
    ...row,
    supplierName: row.supplier_name,
    supplierContact: row.supplier_contact || '',
    requestedDeliveryDate: row.requested_delivery_date || '',
    supplierReference: row.supplier_reference || '',
    createdBy: row.created_by,
    createdByName: row.created_by_profile?.full_name || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: (row.purchase_order_items || []).map((item) => ({
      ...item,
      itemType: item.item_type,
      itemId: item.ingredient_id || item.finished_product_id,
      quantityOrdered: Number(item.quantity_ordered),
      estimatedUnitCost: Number(item.estimated_unit_cost || 0),
      receivedQuantity: Number(item.received_quantity || 0),
      acceptedQuantity: Number(item.accepted_quantity || 0),
      damagedQuantity: Number(item.damaged_quantity || 0),
      missingQuantity: Number(item.missing_quantity || 0),
      actualUnitCost: item.actual_unit_cost == null ? '' : Number(item.actual_unit_cost),
      batchNumber: item.batch_number || '',
      expirationDate: item.expiration_date || '',
      receivingNotes: item.receiving_notes || '',
    })),
    events: (row.purchase_order_events || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
  }
}
