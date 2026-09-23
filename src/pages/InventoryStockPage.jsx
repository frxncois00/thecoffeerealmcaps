import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, Archive, Bell, Box, Check,
  Package, PackageMinus, PackagePlus, PackageX, Pencil, Plus, RefreshCw, Search, X,
} from 'lucide-react'
import AppShell from '../components/AppShell'
import { describeError } from '../utils/describeError'
import {
  fetchIngredients, fetchFinishedProducts, fetchMenuItemOptions,
  fetchMovements, fetchRecipeUsage, fetchIngredientMenuLinks, setIngredientMenuLinks,
  upsertIngredient, archiveIngredient, upsertFinishedProduct, archiveFinishedProduct, adjustStock,
} from '../services/opsInventoryService'
import { getCurrentPortalSession } from '../lib/auth'
import { fetchStaffPreferences, getRememberedStaffFilters, rememberStaffFilters, shouldShowSystemNotification } from '../services/staffSettingsService'
import { useManagementSessionState } from '../hooks/useManagementSessionState'
import { sanitizeCatalogText } from '../utils/inputValidation'

const ENTITY_CONFIGS = {
  ingredient: { key: 'ingredient', label: 'Ingredients', singular: 'Ingredient', fetch: fetchIngredients, upsert: upsertIngredient, archive: archiveIngredient, hasType: true, hasMenuLink: true },
  finished_product: { key: 'finished_product', label: 'Products', singular: 'Product', fetch: () => fetchFinishedProducts({ includeArchived: true }), upsert: upsertFinishedProduct, archive: archiveFinishedProduct, hasType: false, hasMenuLink: true },
}
const PAGE_SIZE = 25

function stockStatus(item) {
  if (item.isArchived) return 'archived'
  if (item.quantity <= 0) return 'out'
  if (item.quantity <= item.minStockLevel) return 'low'
  if (item.highStockLevel > 0 && item.quantity > item.highStockLevel) return 'over'
  return 'healthy'
}
const STATUS_META = {
  out: { label: 'Out of Stock', tone: 'red' },
  low: { label: 'Low Stock', tone: 'amber' },
  healthy: { label: 'Healthy', tone: 'green' },
  over: { label: 'Over Stock', tone: 'blue' },
  archived: { label: 'Archived', tone: 'neutral' },
}
function formatQty(value) {
  const n = Number(value)
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}
function timeAgo(dateString) {
  if (!dateString) return '—'
  const diffMs = Date.now() - new Date(dateString).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(new Date(dateString))
}

export default function InventoryStockPage() {
  const [activeEntity, setActiveEntity] = useState('ingredient')
  const [items, setItems] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => new Date())
  const [busyId, setBusyId] = useState('')
  const [toasts, setToasts] = useState([])

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [filtersReady, setFiltersReady] = useState(false)

  const [formTarget, setFormTarget] = useManagementSessionState('staff:inventory:item-form', null)
  const [drawerItem, setDrawerItem] = useManagementSessionState('staff:inventory:drawer', null)
  const [adjustTarget, setAdjustTarget] = useManagementSessionState('staff:inventory:adjustment', null)
  const [archiveTarget, setArchiveTarget] = useManagementSessionState('staff:inventory:archive-confirmation', null)

  const config = ENTITY_CONFIGS[activeEntity]

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => {
    let active = true
    getCurrentPortalSession().then(async ({ profile }) => {
      if (!profile?.id) return
      try {
        const preferences = await fetchStaffPreferences(profile.id)
        if (!active) return
        const remembered = getRememberedStaffFilters('inventory')
        const savedEntity = remembered?.activeEntity || preferences.inventory_tab
        setActiveEntity(savedEntity === 'finished_product' ? 'finished_product' : 'ingredient')
        setStatusFilter(remembered?.statusFilter || preferences.inventory_filter)
        setPageSize(preferences.rows_per_page)
        if (remembered) {
          setSearch(remembered.search || '')
          setCategoryFilter(remembered.categoryFilter || 'all')
          setTypeFilter(remembered.typeFilter || 'all')
          setSortBy(remembered.sortBy || 'name')
        }
      } catch { /* Default inventory settings remain available before migration. */ }
      finally { if (active) setFiltersReady(true) }
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!filtersReady) return
    rememberStaffFilters('inventory', { activeEntity, search, categoryFilter, statusFilter, typeFilter, sortBy })
  }, [activeEntity, categoryFilter, filtersReady, search, sortBy, statusFilter, typeFilter])

  const load = async (entity = activeEntity) => {
    setLoading(true)
    try {
      const [data, menuOptions] = await Promise.all([ENTITY_CONFIGS[entity].fetch(), fetchMenuItemOptions()])
      setItems(data)
      setMenuItems(menuOptions)
      setError('')
    } catch (cause) {
      setError(describeError(cause, 'Could not load inventory.'))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { setPage(1); load(activeEntity) }, [activeEntity])
  useEffect(() => { if (activeEntity !== 'finished_product' && statusFilter === 'archived') setStatusFilter('all') }, [activeEntity, statusFilter])

  const pushToast = (type, message) => {
    if (!shouldShowSystemNotification(type)) return
    const id = crypto.randomUUID()
    setToasts((c) => [...c, { id, type, message }])
    setTimeout(() => setToasts((c) => c.filter((t) => t.id !== id)), 4500)
  }

  const categories = useMemo(() => [...new Set(items.map((i) => i.category).filter(Boolean))].sort(), [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (q && !item.name.toLowerCase().includes(q)) return false
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
      if (statusFilter !== 'all' && stockStatus(item) !== statusFilter) return false
      if (config.hasType && typeFilter !== 'all' && item.type !== typeFilter) return false
      return true
    })
  }, [items, search, categoryFilter, statusFilter, typeFilter, config.hasType])

  const sorted = useMemo(() => {
    const list = [...filtered]
    if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === 'quantity') list.sort((a, b) => a.quantity - b.quantity)
    else if (sortBy === 'updated') list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    return list
  }, [filtered, sortBy])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize)

  const activeItems = items.filter((item) => !item.isArchived)
  const outCount = activeItems.filter((i) => stockStatus(i) === 'out').length
  const lowCount = activeItems.filter((i) => stockStatus(i) === 'low').length

  const runArchive = async (item) => {
    setBusyId(item.id)
    try {
      await config.archive(item.id)
      setItems((current) => current.filter((i) => i.id !== item.id))
      pushToast('success', `${item.name} was archived.`)
      setArchiveTarget(null)
    } catch (cause) {
      pushToast('error', describeError(cause, 'Could not archive this item.'))
    } finally {
      setBusyId('')
    }
  }

  const runSaveForm = async (payload) => {
    const id = await config.upsert(payload)
    if (config.key === 'ingredient' && id) await setIngredientMenuLinks(id, payload.saleMappings || [])
    await load(activeEntity)
    pushToast('success', `${payload.name} was saved.`)
    setFormTarget(null)
    return id
  }

  const runAdjust = async ({ delta, movementType, reason }) => {
    const target = adjustTarget
    setBusyId(target.item.id)
    try {
      const nextQty = await adjustStock({ itemType: config.key, itemId: target.item.id, delta, movementType, reason })
      setItems((current) => current.map((i) => (i.id === target.item.id ? { ...i, quantity: Number(nextQty) } : i)))
      pushToast('success', `${target.item.name} updated to ${formatQty(nextQty)} ${target.item.unit}.`)
      setAdjustTarget(null)
      return true
    } catch (cause) {
      pushToast('error', describeError(cause, 'Could not adjust stock.'))
      return false
    } finally {
      setBusyId('')
    }
  }

  const attentionCount = outCount + lowCount

  return (
    <AppShell role="staff" title="Inventory Stock Overview" onRefresh={() => load(activeEntity)} titleActions={
      <div className="ops-order-view-toggle" role="tablist" aria-label="Inventory type">
        <button type="button" role="tab" aria-selected={activeEntity === 'ingredient'} className={activeEntity === 'ingredient' ? 'active' : ''} onClick={() => setActiveEntity('ingredient')}>Ingredients</button>
        <button type="button" role="tab" aria-selected={activeEntity === 'finished_product'} className={activeEntity === 'finished_product' ? 'active' : ''} onClick={() => setActiveEntity('finished_product')}>Products</button>
      </div>
    } actions={
      <div className="ops-header-actions">
        <div className="ops-clock">
          <span>{new Intl.DateTimeFormat('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }).format(now)}</span>
          <b>{new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }).format(now)}</b>
        </div>
        <button type="button" className="ops-icon-button" aria-label={`${attentionCount} item${attentionCount === 1 ? '' : 's'} need attention`} title="Items needing attention">
          <Bell size={18} />
          {attentionCount > 0 && <span className="ops-badge">{attentionCount}</span>}
        </button>
        <button type="button" className="ops-icon-button" aria-label="Refresh inventory" title="Refresh" onClick={() => load(activeEntity)} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>
    }>
      {error && <p className="form-error">{error}</p>}

      <div className="inv-summary-row inventory-summary-grid">
        <article className="inv-summary-card tone-red"><span className="inv-summary-icon"><PackageX size={18} /></span><span className="inv-summary-copy"><span>Out of Stock</span><small>Needs replenishment</small></span><b>{outCount}</b></article>
        <article className="inv-summary-card tone-amber"><span className="inv-summary-icon"><AlertTriangle size={18} /></span><span className="inv-summary-copy"><span>Low Stock</span><small>Below alert level</small></span><b>{lowCount}</b></article>
        <article className="inv-summary-card tone-neutral"><span className="inv-summary-icon"><Package size={18} /></span><span className="inv-summary-copy"><span>Total Records</span><small>Tracked inventory</small></span><b>{items.length}</b></article>
      </div>

      <div className="inv-toolbar">
        <label className="ops-search">
          <Search size={17} /><span className="sr-only">Search {config.label.toLowerCase()}</span>
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder={`Search ${config.label.toLowerCase()}…`} />
        </label>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }} aria-label="Filter by category">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} aria-label="Filter by stock status">
          <option value="all">All statuses</option>
          {Object.entries(STATUS_META).filter(([key]) => key !== 'archived' || activeEntity === 'finished_product').map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
        </select>
        {config.hasType && (
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }} aria-label="Filter by type">
            <option value="all">All types</option><option value="wet">Wet</option><option value="dry">Dry</option><option value="other">Other</option>
          </select>
        )}
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort">
          <option value="name">Name: A to Z</option><option value="quantity">Quantity: lowest first</option><option value="updated">Recently updated</option>
        </select>
        <button type="button" className="ops-main-action inv-record-btn" onClick={() => setFormTarget({ item: null })}>
          <Plus size={16} /> Record New {config.singular}
        </button>
      </div>

      {loading ? (
        <InventorySkeleton />
      ) : pageItems.length === 0 ? (
        <div className="inv-empty"><Box size={28} /><h3>No {config.label.toLowerCase()} found</h3><p>Try adjusting your filters, or record a new {config.singular.toLowerCase()}.</p></div>
      ) : (
        <>
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>{config.singular} Name</th><th>Category</th>{config.hasType && <th>Type</th>}
                  <th>Quantity</th><th>Unit</th><th>Status</th><th>Low Stock Alert</th><th>Healthy Point</th><th>Last Updated</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => {
                  const status = stockStatus(item)
                  return (
                    <tr className={item.isArchived ? 'is-archived' : ''} key={item.id}>
                      <td><b>{item.name}</b></td>
                      <td>{item.category || '—'}</td>
                      {config.hasType && <td className="inv-capitalize">{item.type}</td>}
                      <td>{formatQty(item.quantity)}</td>
                      <td>{item.unit}</td>
                      <td><span className={`inv-status tone-${STATUS_META[status].tone}`}>{STATUS_META[status].label}</span></td>
                      <td>{formatQty(item.minStockLevel)}</td>
                      <td>{formatQty(item.highStockLevel)}</td>
                      <td>{timeAgo(item.updatedAt)}</td>
                      <td>
                        <RowActions item={item} busy={busyId === item.id}
                          onView={() => { setDrawerItem(item) }}
                          onEdit={() => { setFormTarget({ item }) }} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="inv-cards">
            {pageItems.map((item) => {
              const status = stockStatus(item)
              return (
                <article className={`inv-card${item.isArchived ? ' is-archived' : ''}`} key={item.id}>
                  <div className="inv-card-top"><b>{item.name}</b><span className={`inv-status tone-${STATUS_META[status].tone}`}>{STATUS_META[status].label}</span></div>
                  <p className="inv-card-meta">{item.category || 'Uncategorized'}{config.hasType ? ` · ${item.type}` : ''}</p>
                  <p className="inv-card-qty">{formatQty(item.quantity)} {item.unit}</p>
                  <p className="inv-card-thresholds">Low: {formatQty(item.minStockLevel)} · Healthy: {formatQty(item.highStockLevel)} · Updated {timeAgo(item.updatedAt)}</p>
                  <div className="inv-card-actions">
                    <button type="button" className="ops-secondary-action" onClick={() => setDrawerItem(item)}>View</button>
                    {!item.isArchived && <button type="button" className="ops-secondary-action" onClick={() => setFormTarget({ item })}><Pencil size={14} /> Edit</button>}
                  </div>
                </article>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="inv-pagination">
              <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {formTarget && (
        <ItemFormModal config={config} item={formTarget.item} menuItems={menuItems} onClose={() => setFormTarget(null)} onSave={runSaveForm} onDelete={() => setArchiveTarget(formTarget.item)} />
      )}
      {drawerItem && (
        <ItemDrawer config={config} item={items.find((i) => i.id === drawerItem.id) || drawerItem}
          onClose={() => setDrawerItem(null)}
          onAdjust={() => { setAdjustTarget({ item: drawerItem }); setDrawerItem(null) }}
          onEdit={() => { setFormTarget({ item: drawerItem }); setDrawerItem(null) }} />
      )}
      {adjustTarget && (
        <AdjustStockModal target={adjustTarget} busy={busyId === adjustTarget.item.id} onClose={() => setAdjustTarget(null)} onConfirm={runAdjust} />
      )}
      {archiveTarget && (
        <ArchiveConfirmModal item={archiveTarget} busy={busyId === archiveTarget.id} onClose={() => setArchiveTarget(null)} onConfirm={() => runArchive(archiveTarget)} />
      )}

      <div className="ops-toasts" role="status" aria-live="polite">
        {toasts.map((t) => <div className={`ops-toast ops-toast-${t.type}`} key={t.id}>{t.type === 'success' ? <Check size={15} /> : <AlertTriangle size={15} />} {t.message}</div>)}
      </div>
    </AppShell>
  )
}

function InventorySkeleton() {
  return <div className="inv-skeleton">{Array.from({ length: 6 }).map((_, i) => <div className="inv-skeleton-row" key={i} />)}</div>
}

function RowActions({ item, busy, onView, onEdit }) {
  return (
    <div className="inv-row-actions">
      <button type="button" className="ops-secondary-action compact" onClick={onView}>View</button>
      {!item.isArchived && <button type="button" className="ops-secondary-action compact inv-action-edit" onClick={onEdit} disabled={busy}><Pencil size={14} /> Edit</button>}
    </div>
  )
}

function ItemFormModal({ config, item, menuItems, onClose, onSave, onDelete }) {
  const draftScope = `staff:inventory:${config.key}:${item?.id || 'new'}:draft`
  const [values, setValues, clearValues] = useManagementSessionState(draftScope, {
    name: item?.name || '', category: item?.category || '', type: item?.type || 'other', unit: item?.unit || '',
    minStockLevel: item?.minStockLevel ?? 10, highStockLevel: item?.highStockLevel ?? (config.key === 'ingredient' ? 500 : 100),
    supplier: item?.supplier || '', notes: item?.notes || '', initialQuantity: item ? item.quantity : 0,
    menuItemId: item?.menuItemId || '', saleMappings: item?.saleMappings || (item?.menuItemId ? [{ menuItemId: item.menuItemId, variantKey: '', unitsPerSale: 1 }] : []),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { if (config.key === 'ingredient' && item?.id) fetchIngredientMenuLinks(item.id).then((links) => set('saleMappings', links)).catch(() => {}) }, [config.key, item?.id])
  const set = (key, value) => setValues((c) => ({ ...c, [key]: value }))
  const close = () => { clearValues(); onClose() }

  const submit = async (event) => {
    event.preventDefault()
    if (!values.name.trim()) return setError('Item name is required.')
    if (!values.unit.trim()) return setError('Unit is required.')
    const min = Number(values.minStockLevel)
    const high = Number(values.highStockLevel)
    if (Number.isNaN(min) || min < 0) return setError('Low-stock threshold must be zero or greater.')
    if (Number.isNaN(high) || high < 0) return setError('Healthy-stock target must be zero or greater.')
    if (high > 0 && min > high) return setError('The low-stock threshold cannot exceed the healthy-stock target.')
    if (config.hasMenuLink && values.saleMappings.some((mapping) => !mapping.menuItemId || Number(config.key === 'ingredient' ? mapping.quantityPerServing : mapping.unitsPerSale) <= 0)) return setError(config.key === 'ingredient' ? 'Choose a menu item and a positive ingredient quantity for every link.' : 'Choose a menu item and a positive inventory quantity for every sale format.')
    if (!item) {
      const initial = Number(values.initialQuantity)
      if (Number.isNaN(initial) || initial < 0) return setError('Starting quantity cannot be negative.')
    }
    setSaving(true); setError('')
    try {
      await onSave({ id: item?.id, ...values, menuItemId: values.saleMappings[0]?.menuItemId || null, minStockLevel: min, highStockLevel: high, initialQuantity: Number(values.initialQuantity) })
      clearValues()
    } catch (cause) {
      setError(describeError(cause, 'Could not save this item.'))
      setSaving(false)
    }
  }

  return (
    <div className="payment-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) close() }}>
      <section className={`payment-modal inv-form-modal inv-form-modal-${config.key}`} role="dialog" aria-modal="true" aria-labelledby="inv-form-title">
        <button className="payment-modal-close" type="button" onClick={close} disabled={saving} aria-label="Close">×</button>
        <header className="inv-form-header"><span className="inv-form-icon"><Package size={20} /></span><div><span>{item ? `Editing ${config.singular.toLowerCase()}` : `New ${config.singular.toLowerCase()}`}</span><h2 id="inv-form-title">{item ? item.name : `Add ${config.singular.toLowerCase()} stock`}</h2></div></header>
        <form className="inv-record-form" onSubmit={submit}>
          <div className="inv-form-details-column">
            <section className="inv-form-section"><header><h3>Item details</h3></header><div className="form-grid">
              <label className="field"><span>{config.singular} name</span><input value={values.name} onChange={(e) => set('name', sanitizeCatalogText(e.target.value, 80))} maxLength={80} required /></label>
              <label className="field"><span>Category</span><input value={values.category} onChange={(e) => set('category', sanitizeCatalogText(e.target.value, 60))} maxLength={60} placeholder="e.g. Milk, Protein, Syrup" /></label>
              {config.hasType && (
                <label className="field"><span>Type</span>
                  <select value={values.type} onChange={(e) => set('type', e.target.value)}>
                    <option value="wet">Wet</option><option value="dry">Dry</option><option value="other">Other</option>
                  </select>
                </label>
              )}
            </div></section>
            <section className="inv-form-section"><header><h3>Stock levels</h3></header><div className="form-grid">
              <label className="field"><span>Unit</span><input value={values.unit} onChange={(e) => set('unit', sanitizeCatalogText(e.target.value, 24))} maxLength={24} placeholder={config.key === 'finished_product' ? 'piece, slice, box' : 'kg, L, pcs'} required /></label>
              {!item && <label className="field"><span>Starting quantity</span><input type="number" min="0" step="any" value={values.initialQuantity} onChange={(e) => set('initialQuantity', e.target.value)} /></label>}
              <label className="field"><span>Low-stock threshold</span><input type="number" min="0" step="any" value={values.minStockLevel} onChange={(e) => set('minStockLevel', e.target.value)} required /></label>
              <label className="field"><span>Healthy-stock target</span><input type="number" min="0" step="any" value={values.highStockLevel} onChange={(e) => set('highStockLevel', e.target.value)} required /></label>
            </div></section>
          </div>
          {config.hasMenuLink && (
            <fieldset className={`inv-sale-mappings${values.saleMappings.length >= 5 ? ' has-scroll' : ''}`}>
              <legend>{config.key === 'ingredient' ? 'Where this ingredient is used' : 'How this product is sold'}</legend>
              {values.saleMappings.map((mapping, index) => {
                const selectedMenuItem = menuItems.find((menuItem) => menuItem.id === mapping.menuItemId)
                const variants = Object.keys(selectedMenuItem?.variant_options?.prices || {})
                const updateMapping = (key, value) => set('saleMappings', values.saleMappings.map((entry, entryIndex) => entryIndex === index ? { ...entry, [key]: value } : entry))
                return <div className="inv-sale-mapping" key={index}><div className="inv-sale-mapping-heading"><b>Link {index + 1}</b></div><label><span>Menu item</span><select value={mapping.menuItemId} onChange={(e) => updateMapping('menuItemId', e.target.value)} aria-label="Menu item"><option value="">Select menu item</option>{menuItems.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
                  {config.key === 'ingredient' ? <><label><span>Quantity used</span><input type="number" min="0.001" step="any" value={mapping.quantityPerServing ?? ''} onChange={(e) => updateMapping('quantityPerServing', e.target.value)} aria-label="Ingredient quantity used" placeholder="e.g. 20" /></label><small className="inv-sale-mapping-unit"><b>{mapping.quantityPerServing || 0} {values.unit || 'unit'}</b> used per menu item</small></> : <>
                  <label><span>Selling option</span><select value={mapping.variantKey} onChange={(e) => updateMapping('variantKey', e.target.value)} aria-label="Menu variant"><option value="">Default sale</option>{variants.map((variant) => <option key={variant} value={variant}>{selectedMenuItem?.variant_options?.labels?.[variant] || variant}</option>)}</select></label>
                  <label><span>Quantity per sale</span><input type="number" min="0.001" step="any" value={mapping.unitsPerSale} onChange={(e) => updateMapping('unitsPerSale', e.target.value)} aria-label="Inventory units per sale" placeholder="e.g. 8" /></label>
                  <small className="inv-sale-mapping-unit"><b>{mapping.unitsPerSale || 0} {values.unit || 'unit'}</b> deducted per sale</small>
                  </>}
                  <button type="button" className="ops-secondary-action compact" onClick={() => set('saleMappings', values.saleMappings.filter((_, entryIndex) => entryIndex !== index))}>Remove link</button>
                </div>
              })}
              <button type="button" className="ops-secondary-action compact" onClick={() => set('saleMappings', [...values.saleMappings, config.key === 'ingredient' ? { menuItemId: '', quantityPerServing: 1 } : { menuItemId: '', variantKey: '', unitsPerSale: 1 }])}>+ {config.key === 'ingredient' ? 'Link another menu item' : 'Link another menu format'}</button>
            </fieldset>
          )}
          {error && <p className="form-error">{error}</p>}
          <div className="payment-modal-actions inv-form-actions">
            {item && <button className="danger-button inv-form-remove-button" type="button" onClick={onDelete} disabled={saving}>Remove item</button>}
            <button className="secondary-button" type="button" onClick={close} disabled={saving}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function AdjustStockModal({ target, busy, onClose, onConfirm }) {
  const { item } = target
  const draftScope = `staff:inventory:${item.id}:adjustment-draft`
  const [direction, setDirection, clearDirection] = useManagementSessionState(`${draftScope}:direction`, target.mode === 'deduction' ? 'deduction' : 'restock')
  const [movementType, setMovementType, clearMovementType] = useManagementSessionState(`${draftScope}:type`, target.mode === 'deduction' ? 'deduction' : 'restock')
  const [amount, setAmount, clearAmount] = useManagementSessionState(`${draftScope}:amount`, '')
  const [reason, setReason, clearReason] = useManagementSessionState(`${draftScope}:reason`, '')
  const [reference, setReference, clearReference] = useManagementSessionState(`${draftScope}:reference`, '')
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const clearDraft = () => { clearDirection(); clearMovementType(); clearAmount(); clearReason(); clearReference() }
  const close = () => { clearDraft(); onClose() }

  const numericAmount = Number(amount)
  const validAmount = amount !== '' && !Number.isNaN(numericAmount) && numericAmount > 0
  const resulting = validAmount ? item.quantity + (direction === 'restock' ? numericAmount : -numericAmount) : null
  const wouldGoNegative = resulting !== null && resulting < 0

  useEffect(() => { setMovementType(direction === 'restock' ? 'restock' : 'deduction') }, [direction, setMovementType])

  const submit = (event) => {
    event.preventDefault()
    if (!validAmount) return setError('Enter an amount greater than zero.')
    if (wouldGoNegative) return setError('This would take stock below zero.')
    if (!reason.trim()) return setError('A reason is required.')
    setError('')
    setConfirming(true)
  }

  if (confirming) {
    return (
      <div className="payment-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) setConfirming(false) }}>
        <section className="payment-modal" role="alertdialog" aria-modal="true" aria-labelledby="inv-confirm-title">
          <span className="payment-modal-kicker">Confirm stock change</span>
          <h2 id="inv-confirm-title">{direction === 'restock' ? 'Add' : 'Deduct'} {formatQty(numericAmount)} {item.unit} {direction === 'restock' ? 'to' : 'from'} {item.name}?</h2>
          <div className="inv-adjust-preview">
            <div><span>Current</span><b>{formatQty(item.quantity)} {item.unit}</b></div>
            <div className="inv-adjust-arrow">→</div>
            <div><span>Resulting</span><b>{formatQty(resulting)} {item.unit}</b></div>
          </div>
          <p><b>Reason:</b> {reason}{reference ? ` — Ref: ${reference}` : ''}</p>
          <div className="payment-modal-actions">
            <button className="secondary-button" type="button" onClick={() => setConfirming(false)} disabled={busy}>Go back</button>
            <button className="primary-button" type="button" disabled={busy} onClick={async () => { if (await onConfirm({ delta: direction === 'restock' ? numericAmount : -numericAmount, movementType, reason: reference ? `${reason} — Ref: ${reference}` : reason })) clearDraft() }}>
              {busy ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="payment-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) close() }}>
      <section className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="inv-adjust-title">
        <button className="payment-modal-close" type="button" onClick={close} aria-label="Close">×</button>
        <span className="payment-modal-kicker">Stock adjustment</span>
        <h2 id="inv-adjust-title">{item.name}</h2>
        <form onSubmit={submit}>
          <div className="inv-direction-toggle">
            <button type="button" className={direction === 'restock' ? 'active' : ''} onClick={() => setDirection('restock')}><PackagePlus size={15} /> Add</button>
            <button type="button" className={direction === 'deduction' ? 'active' : ''} onClick={() => setDirection('deduction')}><PackageMinus size={15} /> Deduct</button>
          </div>
          <div className="form-grid">
            <label className="field"><span>Amount ({item.unit})</span><input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
            <label className="field"><span>Movement type</span>
              <select value={movementType} onChange={(e) => setMovementType(e.target.value)}>
                {direction === 'restock' ? <option value="restock">Restock</option> : <><option value="deduction">Deduction</option><option value="waste">Waste</option></>}
                <option value="adjustment">Adjustment</option>
              </select>
            </label>
          </div>
          <label className="field"><span>Reason</span><textarea rows="2" value={reason} onChange={(e) => setReason(e.target.value.slice(0, 500))} maxLength={500} placeholder="e.g. Weekly delivery, spoilage, recount…" required /></label>
          <label className="field"><span>Reference / supplier / order (optional)</span><input value={reference} onChange={(e) => setReference(e.target.value.slice(0, 80))} maxLength={80} /></label>
          {validAmount && (
            <div className="inv-adjust-preview compact">
              <div><span>Current</span><b>{formatQty(item.quantity)} {item.unit}</b></div>
              <div className="inv-adjust-arrow">→</div>
              <div><span>Resulting</span><b className={wouldGoNegative ? 'inv-negative' : ''}>{formatQty(resulting)} {item.unit}</b></div>
            </div>
          )}
          {error && <p className="form-error">{error}</p>}
          <div className="payment-modal-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <button className="primary-button" type="submit">Review</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ArchiveConfirmModal({ item, busy, onClose, onConfirm }) {
  return (
    <div className="payment-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose() }}>
      <section className="payment-modal" role="alertdialog" aria-modal="true" aria-labelledby="inv-archive-title">
        <span className="payment-modal-kicker">Archive item</span>
        <h2 id="inv-archive-title">Archive {item.name}?</h2>
        <p>This removes it from active inventory lists without deleting its stock history or recipe links. You can restore it later from the database if needed.</p>
        <div className="payment-modal-actions">
          <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Keep item</button>
          <button className="danger-button" type="button" disabled={busy} onClick={onConfirm}>{busy ? 'Archiving…' : 'Archive item'}</button>
        </div>
      </section>
    </div>
  )
}

function ItemDrawer({ config, item, onClose, onAdjust, onEdit }) {
  const [movements, setMovements] = useState([])
  const [recipeUsage, setRecipeUsage] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const status = stockStatus(item)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      fetchMovements(config.key, item.id),
      config.key === 'ingredient' ? fetchRecipeUsage(item.id) : Promise.resolve([]),
    ]).then(([m, r]) => { if (active) { setMovements(m); setRecipeUsage(r); setLoadError('') } })
      .catch((cause) => { if (active) setLoadError(describeError(cause, 'Could not load item history.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [config.key, item.id])

  return (
    <div className="ops-drawer-backdrop inv-view-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <aside className="ops-drawer inv-view-modal" role="dialog" aria-modal="true" aria-labelledby="inv-drawer-title">
        <header className="inv-view-header">
          <div className="inv-view-title">
            <span className="inv-view-icon"><Package size={20} /></span>
            <div>
              <span className="inv-view-kicker">{config.singular} details</span>
              <h2 id="inv-drawer-title">{item.name}</h2>
            </div>
          </div>
          <button className="inv-view-close" type="button" onClick={onClose} aria-label="Close item details"><X size={20} /></button>
        </header>

        <div className="ops-drawer-body inv-view-body">
          <div className="inv-view-column inv-view-column--primary">
            <section className="inv-view-card inv-view-stock-card">
              <div className="inv-view-card-heading">
                <div><span className="inv-view-card-kicker">Live snapshot</span><h3>Current stock</h3></div>
                <span className={`inv-status tone-${STATUS_META[status].tone}`}>{STATUS_META[status].label}</span>
              </div>
              <div className="inv-view-stock-value"><b>{formatQty(item.quantity)}</b><span>{item.unit || 'unit'} available</span></div>
            </section>

            <section className="inv-view-card">
              <div className="inv-view-card-heading"><div><span className="inv-view-card-kicker">Planning</span><h3>Stock thresholds</h3></div></div>
              <dl className="inv-view-detail-grid">
                <div><dt>Low-stock alert</dt><dd>{formatQty(item.minStockLevel)} {item.unit}</dd></div>
                <div><dt>Healthy-stock target</dt><dd>{formatQty(item.highStockLevel)} {item.unit}</dd></div>
              </dl>
            </section>

            <section className="inv-view-card">
              <div className="inv-view-card-heading"><div><span className="inv-view-card-kicker">Reference</span><h3>Item information</h3></div></div>
              <dl className="inv-view-detail-grid">
                <div><dt>Category</dt><dd>{item.category || '—'}</dd></div>
                {config.hasType && <div><dt>Type</dt><dd className="inv-capitalize">{item.type || '—'}</dd></div>}
              </dl>
            </section>

            {config.key === 'ingredient' && (
              <section className="inv-view-card">
                <div className="inv-view-card-heading"><div><span className="inv-view-card-kicker">Recipe connections</span><h3>Used in</h3></div></div>
                {recipeUsage.length === 0 ? <p className="inv-view-empty">Not used in any recipe yet.</p> : (
                  <ul className="inv-view-usage-list">
                    {recipeUsage.map((recipe) => <li key={recipe.menuItemId}><b>{recipe.name}</b><span>{formatQty(recipe.quantityPerServing)} {item.unit} per serving</span></li>)}
                  </ul>
                )}
              </section>
            )}
          </div>

          <div className="inv-view-column inv-view-column--ledger">
            <section className="inv-view-card inv-view-card--ledger">
              <div className="inv-view-card-heading"><div><span className="inv-view-card-kicker">Inventory ledger</span><h3>Recent stock movements</h3></div><span className="inv-view-count">{movements.length} {movements.length === 1 ? 'entry' : 'entries'}</span></div>
              {loadError && <p className="form-error">{loadError}</p>}
              {loading ? <p className="inv-view-empty">Loading movement history…</p> : movements.length === 0 ? <p className="inv-view-empty">No stock movements recorded yet.</p> : (
                <ul className="inv-movement-list inv-view-movement-list">
                  {movements.map((movement) => (
                    <li key={movement.id}>
                      <div className="inv-view-movement-main"><span className={`inv-movement-type ${movement.movement_type}`}>{movement.movement_type}</span><b>{movement.movement_type === 'restock' ? '+' : '−'}{formatQty(movement.quantity)} {item.unit}</b></div>
                      <span className="inv-movement-meta">{movement.reason || 'No reason given'} · {movement.staffName} · {timeAgo(movement.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <footer className="ops-drawer-footer inv-view-footer">
          {item.isArchived ? <span className="inv-archived-note"><Archive size={16} /> Archived record</span> : <><button type="button" className="ops-secondary-action inv-view-adjust" onClick={onAdjust}><PackagePlus size={16} /> Restock / Deduct</button><button type="button" className="ops-main-action inv-view-edit" onClick={onEdit}><Pencil size={16} /> Edit item</button></>}
        </footer>
      </aside>
    </div>
  )
}
