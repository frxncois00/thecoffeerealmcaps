import { supabase } from '../lib/supabase'
import { fetchIngredients } from './opsInventoryService'
import { isPastPurchaseOrderDeliveryDate } from '../utils/purchaseOrderDates'

function purchaseUnitFactor(baseUnit, purchaseUnit) {
  const base = String(baseUnit || '').toLowerCase()
  const purchase = String(purchaseUnit || '').toLowerCase()
  if (['g', 'gram', 'grams'].includes(base) && ['kg', 'kilogram', 'kilograms'].includes(purchase)) return 1000
  if (['kg', 'kilogram', 'kilograms'].includes(base) && ['g', 'gram', 'grams'].includes(purchase)) return 0.001
  if (['ml', 'milliliter', 'milliliters'].includes(base) && ['l', 'liter', 'liters'].includes(purchase)) return 1000
  if (['l', 'liter', 'liters'].includes(base) && ['ml', 'milliliter', 'milliliters'].includes(purchase)) return 0.001
  if (['piece', 'pieces', 'pc', 'pcs'].includes(base) && purchase === 'dozen') return 12
  return 1
}

export async function fetchPurchaseOrders(createdBy = null) {
  let query = supabase
    .from('purchase_orders')
    .select('*,created_by_profile:profiles!purchase_orders_created_by_fkey(full_name),purchase_order_items(*),purchase_order_events(id,from_status,to_status,action,note,created_by,created_at,profiles(full_name)),purchase_order_documents(*),purchase_order_receiving_reports(*,submitted_profile:profiles!purchase_order_receiving_reports_submitted_by_fkey(full_name),reviewed_profile:profiles!purchase_order_receiving_reports_reviewed_by_fkey(full_name))')
    .order('updated_at', { ascending: false })
  if (createdBy) query = query.eq('created_by', createdBy)
  const { data, error } = await query
  if (error) throw error
  return (data || []).map(normalizePurchaseOrder)
}

export async function fetchPurchaseOrderOptions() {
  const ingredients = await fetchIngredients()
  return [
    ...ingredients.map((item) => ({ id: item.id, itemType: 'ingredient', name: item.name, unit: item.unit, quantity: item.quantity, criticalStockLevel: item.criticalStockLevel, minStockLevel: item.minStockLevel, highStockLevel: item.highStockLevel, supplier: item.supplier || '' })),
  ].sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchSuppliers() {
  const { data, error } = await supabase.from('suppliers').select('id,name,contact,supplier_items(item_type,ingredient_id,finished_product_id,unit_price)').order('name')
  if (error) throw error
  return (data || []).map((supplier) => ({ ...supplier, items: supplier.supplier_items || [] }))
}

export async function saveSupplier(payload) {
  const { data, error } = await supabase.rpc('save_supplier', {
    p_name: payload.name,
    p_contact: payload.contact || null,
    p_items: payload.items.map((item) => ({ item_type: item.itemType, item_id: item.id, unit_price: item.unitPrice })),
  })
  if (error) throw error
  return data
}

export async function savePurchaseOrder(payload) {
  if (isPastPurchaseOrderDeliveryDate(payload.requestedDeliveryDate)) {
    throw new Error('Requested delivery date cannot be in the past.')
  }
  const { data, error } = await supabase.rpc('save_purchase_order', {
    p_id: payload.id || null,
    p_supplier_name: payload.supplierName,
    p_supplier_contact: payload.supplierContact || null,
    p_requested_delivery_date: payload.requestedDeliveryDate || null,
    p_reason: null,
    p_notes: null,
    p_items: payload.items.map((item) => {
      const option = payload.options?.find((entry) => entry.id === item.itemId && entry.itemType === item.itemType)
      const baseUnit = String(option?.unit || '')
      const purchaseUnit = String(item.purchaseUnit || option?.unit || '')
      const factor = purchaseUnitFactor(baseUnit, purchaseUnit)
      const baseQuantity = Number(item.quantityOrdered) * factor
      const totalCost = Number(item.estimatedTotalCost || 0)
      return {
        item_type: item.itemType,
        item_id: item.itemId,
        quantity_ordered: baseQuantity,
        estimated_unit_cost: baseQuantity > 0 ? totalCost / baseQuantity : 0,
      }
    }),
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

export async function submitPurchaseOrderDelivery(id, { lines, answers, notes = '', documentIds, report }) {
  const { error } = await supabase.rpc('submit_purchase_order_delivery', {
    p_id: id, p_lines: lines.map((line) => ({ id: line.id, receivedQuantity: Number(line.receivedQuantity), selected: line.selected, issues: line.issues.map((issue) => ({ type: issue.type, quantity: Number(issue.quantity) })) })),
    p_answers: answers, p_notes: notes || null, p_document_ids: documentIds, p_report: report,
  })
  if (error) throw error
}

export async function returnPurchaseOrderDelivery(id, { lines, notes = '', documentIds }) {
  const { error } = await supabase.rpc('return_purchase_order_delivery', {
    p_id: id,
    p_lines: lines.map((line) => ({ id: line.id, receivedQuantity: Number(line.receivedQuantity) })),
    p_document_ids: documentIds,
    p_notes: notes || null,
  })
  if (error) throw error
}

export async function reviewPurchaseOrderDelivery(id, reportId, note) {
  const { error } = await supabase.rpc('decide_purchase_order_receiving', { p_id: id, p_report_id: reportId, p_decision: 'approve', p_note: note || null, p_replacement: true })
  if (error) throw error
}

export async function settlePurchaseOrderDelivery(id, amount, reference, documentIds) {
  const { error } = await supabase.rpc('settle_purchase_order_delivery', { p_id: id, p_amount: amount, p_reference: reference, p_document_ids: documentIds })
  if (error) throw error
}

export async function uploadPurchaseOrderDocument(id, type, file) {
  if (!file) throw new Error('Choose a file to upload.')
  const mimeByExtension = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }
  const extension = file.name.split('.').pop()?.toLowerCase()
  const contentType = mimeByExtension[extension]
  if (!contentType || (file.type && file.type !== contentType && file.type !== 'application/octet-stream')) throw new Error('Upload a JPG, PNG, WEBP, PDF, Word, or Excel file.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Files must be 10 MB or smaller.')
  const safeName = file.name.replace(/[^a-z0-9._-]/gi, '-').toLowerCase()
  const path = `${id}/${type}/${crypto.randomUUID()}-${safeName}`
  const { error: uploadError } = await supabase.storage.from('purchase-order-documents').upload(path, file, { contentType, upsert: false })
  if (uploadError) throw uploadError
  const { data: authData } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('purchase_order_documents').insert({ purchase_order_id: id, document_type: type, storage_path: path, file_name: file.name, mime_type: contentType, uploaded_by: authData.user?.id }).select().single()
  if (error) throw error
  return data
}

export async function getPurchaseOrderDocumentUrl(path) {
  if (!path) return null
  const { data, error } = await supabase.storage.from('purchase-order-documents').createSignedUrl(path, 300)
  if (error) throw error
  return data?.signedUrl || null
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
    documents: row.purchase_order_documents || [],
    reports: (row.purchase_order_receiving_reports || []).sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)),
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
