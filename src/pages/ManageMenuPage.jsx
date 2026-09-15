import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle, Archive, Bell, Box, Check, ClipboardCheck, Copy, Eye, ExternalLink, Folder,
  Grid, ImagePlus, List, MoreVertical, Pencil, Plus, RefreshCw, Search, ShieldCheck, SlidersHorizontal, Sparkles, Star, Tags, TrendingUp, X,
} from 'lucide-react'
import AppShell from '../components/AppShell'
import '../menu-discount.css'
import { money } from '../utils/money'
import { describeError } from '../utils/describeError'
import { sanitizeCatalogText } from '../utils/inputValidation'
import { supabase } from '../lib/supabase'
import {
  fetchMainCategories, fetchSubcategories, fetchManageMenuItems, fetchIngredientOptions, fetchFinishedProductOptions, fetchAddonOptions, fetchMenuItemRecipe, fetchMenuItemProductLinks,
  upsertMainCategory, archiveMainCategory, upsertSubcategory, archiveSubcategory,
  upsertMenuItem, setMenuItemAvailability, archiveMenuItem, duplicateMenuItem, setMenuItemRecipe, setMenuItemConfiguration, uploadMenuItemImage,
  requestMenuDiscountEligibility,
} from '../services/manageMenuService'
import { shouldShowSystemNotification } from '../services/staffSettingsService'
import { createMenuApprovalRequest, getMenuChangeTypes } from '../services/menuApprovalService'
import { useManagementSessionState } from '../hooks/useManagementSessionState'

const REASON_META = {
  manual: { label: 'Manually disabled', tone: 'neutral' },
  missing_ingredient: { label: 'Missing ingredient', tone: 'red' },
  insufficient_stock: { label: 'Low ingredient stock', tone: 'amber' },
  archived: { label: 'Archived', tone: 'neutral' },
  scheduled: { label: 'Scheduled availability', tone: 'blue' },
}
const TEMP_LABEL = { none: 'No temperature', hot_only: 'Hot only', iced_only: 'Iced only', flexible: 'Flexible' }
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

export default function ManageMenuPage() {
  const [mainCategories, setMainCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => new Date())
  const [busyId, setBusyId] = useState('')
  const [toasts, setToasts] = useState([])

  const [tab, setTab] = useManagementSessionState('staff:menu:tab', 'all')
  const [subcategoryFilter, setSubcategoryFilter] = useManagementSessionState('staff:menu:subcategory-filter', 'all')
  const [search, setSearch] = useManagementSessionState('staff:menu:search', '')
  const [customizableFilter, setCustomizableFilter] = useManagementSessionState('staff:menu:customizable-filter', 'all')
  const [minPrice, setMinPrice] = useManagementSessionState('staff:menu:min-price', '')
  const [maxPrice, setMaxPrice] = useManagementSessionState('staff:menu:max-price', '')
  const [sortBy, setSortBy] = useManagementSessionState('staff:menu:sort', 'name')
  const [view, setView] = useManagementSessionState('staff:menu:view', 'grid')
  const [selectedIds, setSelectedIds] = useManagementSessionState('staff:menu:selected-items', [])
  const [menuOpenId, setMenuOpenId] = useState('')

  const [formTarget, setFormTarget] = useManagementSessionState('staff:menu:item-form', null)
  const [drawerItem, setDrawerItem] = useManagementSessionState('staff:menu:drawer', null)
  const [availabilityTarget, setAvailabilityTarget] = useManagementSessionState('staff:menu:availability-confirmation', null)
  const [archiveTarget, setArchiveTarget] = useManagementSessionState('staff:menu:archive-confirmation', null)
  const [categoryManagerOpen, setCategoryManagerOpen] = useManagementSessionState('staff:menu:category-manager', false)
  const [addonManagerOpen, setAddonManagerOpen] = useManagementSessionState('staff:menu:addon-manager', false)
  const [approvalTarget, setApprovalTarget] = useState(null)

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [cats, subs, menu] = await Promise.all([fetchMainCategories(), fetchSubcategories(), fetchManageMenuItems()])
      setMainCategories(cats); setSubcategories(subs); setItems(menu); setError('')
    } catch (cause) {
      setError(describeError(cause, 'Could not load the menu.'))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    const channel = supabase
      .channel('manage-menu-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'main_categories' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'addons' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'addon_subcategories' }, () => load())
      .subscribe()
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    const onApprovalChanged = () => load()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('menu-approval-requests-changed', onApprovalChanged)
    return () => { supabase.removeChannel(channel); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('menu-approval-requests-changed', onApprovalChanged) }
  }, [])

  const pushToast = (type, message) => {
    if (!shouldShowSystemNotification(type)) return
    const id = crypto.randomUUID()
    setToasts((c) => [...c, { id, type, message }])
    setTimeout(() => setToasts((c) => c.filter((t) => t.id !== id)), 4500)
  }

  const requestApproval = (target, operation) => new Promise((resolve, reject) => {
    setApprovalTarget({ ...target, operation, resolve, reject, busy: false })
  })

  const confirmApproval = async () => {
    if (!approvalTarget || approvalTarget.busy) return
    const target = approvalTarget
    setApprovalTarget((current) => ({ ...current, busy: true }))
    try {
      const result = target.bulkDiscount
        ? await requestMenuDiscountEligibility(target.payload.ids, true)
        : await createMenuApprovalRequest({ action: target.action, itemName: target.itemName, summary: target.summary, changeTypes: target.changeTypes, operation: target.operationKey, payload: target.payload })
      target.resolve(result); setApprovalTarget(null)
    }
    catch (cause) { target.reject(cause); setApprovalTarget(null) }
  }

  const activeSubcategories = useMemo(() => {
    const usedIds = new Set(items.filter((i) => !i.isArchived).map((i) => i.subcategoryId))
    return subcategories.filter((s) => !s.is_archived && usedIds.has(s.id))
  }, [subcategories, items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const min = minPrice !== '' ? Number(minPrice) : null
    const max = maxPrice !== '' ? Number(maxPrice) : null
    return items.filter((item) => {
      if (tab === 'archived' && !item.isArchived) return false
      if (tab !== 'archived' && item.isArchived) return false
      if (tab === 'available' && !item.available) return false
      if (tab === 'unavailable' && item.available) return false
      if (subcategoryFilter !== 'all' && item.subcategoryId !== subcategoryFilter) return false
      if (q && !item.name.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q)) return false
      if (customizableFilter === 'customizable' && !(item.allowIce || item.allowSugar || item.allowAddons || item.temperatureType === 'flexible')) return false
      if (customizableFilter === 'fixed' && (item.allowIce || item.allowSugar || item.allowAddons || item.temperatureType === 'flexible')) return false
      if (min !== null && item.price < min) return false
      if (max !== null && item.price > max) return false
      return true
    })
  }, [items, tab, subcategoryFilter, search, customizableFilter, minPrice, maxPrice])

  const sorted = useMemo(() => {
    const list = [...filtered]
    if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === 'name-desc') list.sort((a, b) => b.name.localeCompare(a.name))
    else if (sortBy === 'most-ordered') list.sort((a, b) => b.orderCount - a.orderCount || a.name.localeCompare(b.name))
    else if (sortBy === 'least-ordered') list.sort((a, b) => a.orderCount - b.orderCount || a.name.localeCompare(b.name))
    else if (sortBy === 'lowest-price') list.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name))
    else if (sortBy === 'highest-price') list.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name))
    return list
  }, [filtered, sortBy])

  const activeItems = items.filter((i) => !i.isArchived)
  const availableCount = activeItems.filter((i) => i.available).length
  const drinkMainId = mainCategories.find((c) => (c.name || '').toLowerCase().includes('drink'))?.id
  const foodMainId = mainCategories.find((c) => (c.name || '').toLowerCase().includes('food'))?.id
  const drinksCount = activeItems.filter((i) => i.mainCategoryId === drinkMainId).length
  const foodsCount = activeItems.filter((i) => i.mainCategoryId === foodMainId).length
  const unavailableCount = activeItems.length - availableCount

  const toggleSelect = (id) => setSelectedIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
  const clearSelection = () => setSelectedIds([])

  const runToggleAvailability = async (item) => {
    setBusyId(item.id)
    try {
      await setMenuItemAvailability(item.id, !item.manualAvailable)
      pushToast('success', `${item.name} is now ${!item.manualAvailable ? 'available' : 'unavailable'}.`)
      await load()
      setAvailabilityTarget(null)
    } catch (cause) {
      pushToast('error', describeError(cause, 'Could not update availability.'))
    } finally {
      setBusyId('')
    }
  }

  const runDuplicate = async (item) => {
    setBusyId(item.id)
    try {
      await duplicateMenuItem(item.id)
      pushToast('success', `${item.name} was duplicated.`)
      await load()
    } catch (cause) {
      pushToast('error', describeError(cause, 'Could not duplicate this item.'))
    } finally {
      setBusyId('')
    }
  }

  const runArchive = async (item) => {
    setBusyId(item.id)
    try {
      await archiveMenuItem(item.id)
      pushToast('success', `${item.name} was archived.`)
      setArchiveTarget(null)
      await load()
    } catch (cause) {
      pushToast('error', describeError(cause, 'Could not archive this item.'))
    } finally {
      setBusyId('')
    }
  }

  const executeBulkAvailability = async (available, ids = selectedIds) => {
    setBusyId('bulk')
    try {
      await Promise.all(ids.map((id) => setMenuItemAvailability(id, available)))
      pushToast('success', `Updated ${ids.length} item${ids.length === 1 ? '' : 's'}.`)
      clearSelection()
      await load()
      setAvailabilityTarget(null)
    } catch (cause) {
      pushToast('error', describeError(cause, 'Could not update the selected items.'))
    } finally {
      setBusyId('')
    }
  }

  const runBulkAvailability = (available) => setAvailabilityTarget({
    id: 'bulk', name: `${selectedIds.length} selected menu items`, manualAvailable: !available,
    isBulk: true, targetAvailable: available, ids: [...selectedIds],
  })

  const attentionCount = unavailableCount
  const discountSelection = items.filter(item => selectedIds.includes(item.id) && !item.isArchived && !item.onlineBenefitEligible)
  const runBulkDiscountEligibility = async () => {
    const ids = discountSelection.map(item => item.id)
    if (!ids.length || busyId) return
    setBusyId('bulk')
    try {
      const count = await requestApproval({ bulkDiscount: true, itemName: `${ids.length} selected item${ids.length === 1 ? '' : 's'}`, summary: 'Enable online Senior Citizen / PWD discount eligibility. Items will be archived while awaiting admin review', changeTypes: ['Online SC/PWD discount eligibility'], payload: { ids } })
      clearSelection(); await load()
      pushToast('success', `${count} eligibility request${count === 1 ? '' : 's'} sent for admin review.`)
    } catch (cause) {
      if (cause?.code !== 'APPROVAL_CANCELLED') pushToast('error', describeError(cause, 'Could not submit discount eligibility changes.'))
    } finally { setBusyId('') }
  }

  return (
    <AppShell role="staff" title="Manage Menu" onRefresh={load} actions={
      <div className="ops-header-actions">
        <div className="ops-clock">
          <span>{new Intl.DateTimeFormat('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }).format(now)}</span>
          <b>{new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true }).format(now)}</b>
        </div>
        <button type="button" className="ops-icon-button" aria-label={`${attentionCount} unavailable`} title="Unavailable items">
          <Bell size={18} />
          {attentionCount > 0 && <span className="ops-badge">{attentionCount}</span>}
        </button>
        <button type="button" className="ops-icon-button" aria-label="Refresh menu" title="Refresh" onClick={load} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>
    }>
      {error && <p className="form-error">{error}</p>}

      <section className="inv-summary-row menu-summary-grid" aria-label="Menu overview">
        <article className="inv-summary-card menu-summary-card accent-green">
          <span className="menu-summary-copy"><span>Active Items</span></span>
          <strong>{activeItems.length}</strong>
        </article>
        <article className="inv-summary-card menu-summary-card accent-green">
          <span className="menu-summary-copy"><span>Drinks</span></span>
          <strong>{drinksCount}</strong>
        </article>
        <article className="inv-summary-card menu-summary-card accent-green">
          <span className="menu-summary-copy"><span>Foods</span></span>
          <strong>{foodsCount}</strong>
        </article>
        <article className="inv-summary-card menu-summary-card accent-blue">
          <span className="menu-summary-copy"><span>Available</span></span>
          <strong>{availableCount}</strong>
        </article>
        <article className="inv-summary-card menu-summary-card accent-gray">
          <span className="menu-summary-copy"><span>Unavailable</span></span>
          <strong>{unavailableCount}</strong>
        </article>
      </section>

      <div className="menu-manage-tools">
        <label className="menu-manage-search">
          <Search size={17} /><span className="sr-only">Search menu items</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search drinks, cakes, and meals..." />
          {search && <button type="button" className="menu-manage-search-clear" aria-label="Clear search" onClick={() => setSearch('')}><X size={14} /></button>}
        </label>
        <div className="menu-manage-chip-row" aria-label="Menu categories">
          <button type="button" aria-pressed={subcategoryFilter === 'all'} className={`menu-manage-chip ${subcategoryFilter === 'all' ? 'active' : ''}`} onClick={() => setSubcategoryFilter('all')}>All</button>
          {activeSubcategories.map((s) => (
            <button type="button" key={s.id} aria-pressed={subcategoryFilter === s.id} className={`menu-manage-chip ${subcategoryFilter === s.id ? 'active' : ''}`} onClick={() => setSubcategoryFilter(s.id)}>{s.display_name || s.name}</button>
          ))}
        </div>
      </div>

      <div className="menu-manage-toolbar">
        <div className="menu-toolbar-group menu-toolbar-main-actions">
          <button type="button" className="ops-main-action compact menu-add-item-action" onClick={() => setFormTarget({ item: null })}><Plus size={15} /> Add Item</button>
          <button type="button" className="ops-secondary-action compact" onClick={() => setCategoryManagerOpen(true)}><Folder size={15} /> Manage Categories</button>
          <button type="button" className="ops-secondary-action compact" onClick={() => setAddonManagerOpen(true)}><Sparkles size={15} /> Manage Add-ons</button>
          <span className="menu-filter-label" aria-hidden="true">Filters:</span>
          <label className="menu-sort-control">
            <span className="sr-only">Sort items</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Sort by: Ascending</option>
              <option value="name-desc">Sort by: Descending</option>
              <option value="most-ordered">Sort by: Most Ordered</option>
              <option value="least-ordered">Sort by: Least Ordered</option>
              <option value="lowest-price">Sort by: Lowest Price</option>
              <option value="highest-price">Sort by: Highest Price</option>
            </select>
          </label>
          <label className="menu-inline-filter menu-customizable-filter">
            <span className="sr-only">Filter by customization</span>
            <select value={customizableFilter} onChange={(e) => setCustomizableFilter(e.target.value)}>
              <option value="all">Customizable / fixed</option><option value="customizable">Customizable</option><option value="fixed">Fixed</option>
            </select>
          </label>
          <label className="menu-inline-filter menu-price-filter"><span className="sr-only">Minimum price</span><input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min. price" /></label>
          <label className="menu-inline-filter menu-price-filter"><span className="sr-only">Maximum price</span><input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max price" /></label>
          <button type="button" className="menu-clear-filters" onClick={() => { setSortBy('name'); setCustomizableFilter('all'); setMinPrice(''); setMaxPrice('') }}>Clear</button>
        </div>
        <div className="menu-toolbar-group menu-toolbar-view-actions">
          <div className="menu-view-toggle" role="group" aria-label="Menu view">
            <button type="button" className={view === 'grid' ? 'active' : ''} aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><Grid size={16} /></button>
            <button type="button" className={view === 'list' ? 'active' : ''} aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={16} /></button>
          </div>
          <a className="ops-secondary-action compact menu-preview-link" href="/menu" target="_blank" rel="noreferrer"><ExternalLink size={15} /> Preview as Customer</a>
        </div>
      </div>

      <div className="menu-status-row">
        <div className="inv-tabs" role="tablist" aria-label="Menu item status">
          {[['all', 'All Items'], ['available', 'Available Now'], ['unavailable', 'Unavailable'], ['archived', 'Archived']].map(([key, label]) => (
            <button type="button" key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''} onClick={() => { setTab(key); clearSelection() }}>{label}</button>
          ))}
        </div>

        {selectedIds.length > 0 && (
          <div className="menu-bulk-bar" aria-live="polite">
            <span>{selectedIds.length} selected</span>
            <button type="button" className="ops-secondary-action compact" disabled={Boolean(busyId) || loading || !discountSelection.length} onClick={runBulkDiscountEligibility} title="Enable online SC/PWD discounts for selected active items that are not yet eligible">Enable SC/PWD discount ({discountSelection.length})</button>
            <button type="button" className="ops-secondary-action compact" disabled={busyId === 'bulk'} onClick={() => runBulkAvailability(true)}>Mark Available</button>
            <button type="button" className="ops-secondary-action compact" disabled={busyId === 'bulk'} onClick={() => runBulkAvailability(false)}>Mark Unavailable</button>
            <button type="button" className="ops-secondary-action compact" onClick={clearSelection}>Clear</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="inv-skeleton">{Array.from({ length: 6 }).map((_, i) => <div className="inv-skeleton-row" key={i} />)}</div>
      ) : sorted.length === 0 ? (
        <div className="inv-empty"><Box size={28} /><h3>No menu items found</h3><p>Try adjusting your filters, or add a new item.</p></div>
      ) : (
        <div className={view === 'grid' ? 'menu-item-grid' : 'menu-item-list'}>
          {sorted.map((item) => (
            <MenuItemCard
              key={item.id} item={item} view={view} busy={busyId === item.id}
              selected={selectedIds.includes(item.id)} onToggleSelect={() => toggleSelect(item.id)}
              menuOpen={menuOpenId === item.id} onToggleMenu={() => setMenuOpenId((id) => (id === item.id ? '' : item.id))}
              onView={() => { setDrawerItem(item); setMenuOpenId('') }}
              onEdit={() => { setFormTarget({ item }); setMenuOpenId('') }}
              onToggleAvailability={() => setAvailabilityTarget(item)}
              onDuplicate={() => { requestApproval({ action: 'add', itemName: `${item.name} copy`, summary: 'Create a duplicate menu item', changeTypes: ['New item'], operationKey: 'duplicate_menu_item', payload: { id: item.id } }, () => runDuplicate(item)).then(() => pushToast('success', `${item.name} duplication sent for admin review.`)).catch(() => {}); setMenuOpenId('') }}
              onArchive={() => { setArchiveTarget(item); setMenuOpenId('') }}
            />
          ))}
        </div>
      )}

      {formTarget && (
        <ItemFormModal
          item={formTarget.item} mainCategories={mainCategories} subcategories={subcategories}
          onClose={() => setFormTarget(null)}
          onDelete={() => { const target = formTarget.item; setFormTarget(null); setArchiveTarget(target) }}
          onSave={async (payload) => { const id = await requestApproval({ action: payload.id ? 'change' : 'add', itemName: payload.name, summary: payload.id ? `Save menu changes${Boolean(formTarget.item?.onlineBenefitEligible) !== Boolean(payload.onlineBenefitEligible) ? `; online SC/PWD discount eligibility ${payload.onlineBenefitEligible ? 'on' : 'off'}` : ''}` : `Add this menu item to the catalog; online SC/PWD discount eligibility ${payload.onlineBenefitEligible ? 'on' : 'off'}`, changeTypes: getMenuChangeTypes(formTarget.item, payload), operationKey: 'upsert_menu_item', payload }, () => Promise.resolve()); pushToast('success', `${payload.name} was sent for admin review.`); setFormTarget(null); return id }}
        />
      )}
      {drawerItem && (
        <ItemDrawer item={items.find((i) => i.id === drawerItem.id) || drawerItem}
          onClose={() => setDrawerItem(null)}
          onEdit={() => { setFormTarget({ item: drawerItem }); setDrawerItem(null) }}
          onToggleAvailability={() => setAvailabilityTarget(drawerItem)}
        />
      )}
      {availabilityTarget && (
        <div
          className="payment-modal-backdrop ops-modal-backdrop"
          onMouseDown={(e) => { if (e.target === e.currentTarget && busyId !== availabilityTarget.id) setAvailabilityTarget(null) }}
          onKeyDown={(e) => { if (e.key === 'Escape' && busyId !== availabilityTarget.id) setAvailabilityTarget(null) }}
        >
          <section className="payment-modal ops-popup-modal menu-availability-modal" role="dialog" aria-modal="true" aria-labelledby="menu-availability-title" aria-describedby="menu-availability-description">
            <span className="payment-modal-kicker">Confirmation required</span>
            <h2 id="menu-availability-title">Mark {availabilityTarget.name} {availabilityTarget.manualAvailable ? 'unavailable' : 'available'}?</h2>
            <p id="menu-availability-description">
              This change will apply immediately.{' '}
              {availabilityTarget.manualAvailable
                ? availabilityTarget.isBulk ? 'All selected items will no longer be available for ordering.' : 'Customers will no longer be able to order this item until you make it available again.'
                : availabilityTarget.isBulk ? 'All selected items will be available for ordering when their ingredients are in stock.' : 'Customers will be able to see and order this item when its ingredients are in stock.'}
            </p>
            <div className="payment-modal-actions">
              <button className="secondary-button" type="button" autoFocus onClick={() => setAvailabilityTarget(null)} disabled={busyId === availabilityTarget.id}>Cancel</button>
              <button
                className={availabilityTarget.manualAvailable ? 'danger-button' : 'primary-button'}
                type="button"
                disabled={busyId === availabilityTarget.id}
                onClick={() => availabilityTarget.isBulk ? executeBulkAvailability(availabilityTarget.targetAvailable, availabilityTarget.ids) : runToggleAvailability(availabilityTarget)}
              >
                {busyId === availabilityTarget.id
                  ? 'Updating…'
                  : availabilityTarget.manualAvailable ? 'Mark unavailable' : 'Mark available'}
              </button>
            </div>
          </section>
        </div>
      )}
      {archiveTarget && (
        <div className="payment-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && busyId !== archiveTarget.id) setArchiveTarget(null) }}>
          <section className="payment-modal" role="alertdialog" aria-modal="true" aria-labelledby="menu-archive-title">
            <span className="payment-modal-kicker">Admin review required</span>
            <h2 id="menu-archive-title">Delete {archiveTarget.name}?</h2>
            <p>This deletion must be reviewed by an administrator before it is applied. The item will be archived to preserve past orders, receipts, and recipes.</p>
            <div className="payment-modal-actions">
              <button className="secondary-button" type="button" onClick={() => setArchiveTarget(null)} disabled={busyId === archiveTarget.id}>Keep item</button>
              <button className="danger-button" type="button" disabled={busyId === archiveTarget.id} onClick={() => { const target = archiveTarget; setArchiveTarget(null); requestApproval({ action: 'remove', itemName: target.name, summary: 'Remove this menu item from active listings', changeTypes: ['Item removal'], operationKey: 'archive_menu_item', payload: { id: target.id } }, () => runArchive(target)).then(() => pushToast('success', `${target.name} removal sent for admin review.`)).catch(() => {}) }}>{busyId === archiveTarget.id ? 'Archiving…' : 'Send for review'}</button>
            </div>
          </section>
        </div>
      )}
      {categoryManagerOpen && (
        <CategoryManagerModal
          mainCategories={mainCategories} subcategories={subcategories}
          onClose={() => setCategoryManagerOpen(false)}
          onChanged={load} pushToast={pushToast} requestApproval={requestApproval}
        />
      )}
      {addonManagerOpen && (
        <AddOnManagerModal
          mainCategories={mainCategories} subcategories={subcategories}
          onClose={() => setAddonManagerOpen(false)}
          pushToast={pushToast} requestApproval={requestApproval}
        />
      )}

      <div className="ops-toasts" role="status" aria-live="polite">
        {toasts.map((t) => <div className={`ops-toast ops-toast-${t.type}`} key={t.id}>{t.type === 'success' ? <Check size={15} /> : <AlertTriangle size={15} />} {t.message}</div>)}
      </div>
      {approvalTarget && <ApprovalRequiredModal target={approvalTarget} onClose={() => { if (!approvalTarget.busy) { const cause = new Error('Approval request cancelled'); cause.code = 'APPROVAL_CANCELLED'; approvalTarget.reject(cause); setApprovalTarget(null) } }} onConfirm={confirmApproval} />}
    </AppShell>
  )
}

function ApprovalRequiredModal({ target, onClose, onConfirm }) {
  return <div className="payment-modal-backdrop ops-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !target.busy) onClose() }}>
    <section className="payment-modal menu-approval-required-modal" role="alertdialog" aria-modal="true" aria-labelledby="menu-approval-required-title" aria-describedby="menu-approval-required-description">
      <span className="payment-modal-kicker">Admin review required</span>
      <span className="menu-approval-required-icon"><ClipboardCheck size={22} /></span>
      <h2 id="menu-approval-required-title">Send for admin approval?</h2>
      <p id="menu-approval-required-description"><b>{target.itemName}</b> · {target.summary}.</p>
      <div className="menu-approval-change-types"><span>Changes</span><div>{target.changeTypes.map((type) => <em key={type}>{type}</em>)}</div></div>
      <div className="payment-modal-actions"><button className="secondary-button" type="button" autoFocus onClick={onClose} disabled={target.busy}>Cancel</button><button className="primary-button" type="button" onClick={onConfirm} disabled={target.busy}>{target.busy ? 'Sending…' : 'Send for admin review'}</button></div>
    </section>
  </div>
}

function MenuItemCard({ item, view, busy, selected, onToggleSelect, menuOpen, onToggleMenu, onView, onEdit, onToggleAvailability, onDuplicate, onArchive }) {
  const reason = item.unavailableReason ? REASON_META[item.unavailableReason] : null
  const customizable = item.allowIce || item.allowSugar || item.allowAddons || item.temperatureType === 'flexible'
  return (
    <article className={`menu-item-card ${view === 'list' ? 'list' : ''}`}>
      <label className="menu-card-select"><input type="checkbox" checked={selected} onChange={onToggleSelect} aria-label={`Select ${item.name}`} /></label>
      <div className="menu-card-media"><img src={item.image} alt={item.name} loading="lazy" />
        <div className="inv-overflow menu-card-kebab">
          <button type="button" className="ops-icon-button small" aria-label={`More actions for ${item.name}`} aria-expanded={menuOpen} onClick={onToggleMenu}><MoreVertical size={15} /></button>
          {menuOpen && (
            <div className="inv-overflow-menu" role="menu">
              <button type="button" role="menuitem" onClick={onView}><Eye size={14} /> View details</button>
              <button type="button" role="menuitem" onClick={onDuplicate}><Copy size={14} /> Duplicate item</button>
              <button type="button" role="menuitem" className="danger" onClick={onArchive}><Archive size={14} /> Archive item</button>
            </div>
          )}
        </div>
      </div>
      <div className="menu-card-body">
        <p className="menu-card-eyebrow">{item.mainCategory}{item.subcategory ? ` · ${item.subcategory}` : ''}</p>
        <div className="menu-card-title-row">
          <b>{item.name}</b>
          {item.isBestseller && <span className="menu-badge tone-gold" title="Bestseller"><Star size={12} /></span>}
          {item.isFeatured && <span className="menu-badge tone-blue" title="Featured"><TrendingUp size={12} /></span>}
        </div>
        <p className="menu-card-desc">{item.description || 'No description yet.'}</p>
        <p className="menu-card-price">{money(item.price)}</p>
        <div className="menu-card-badges">
          <span className={`inv-status tone-${item.available ? 'green' : 'red'}`}>{item.available ? 'Available' : 'Unavailable'}</span>
          {customizable && <span className="inv-status tone-blue">{item.temperatureType === 'iced_only' ? 'Iced only' : item.temperatureType === 'hot_only' ? 'Hot only' : 'Flexible'}</span>}
          {item.onlineBenefitEligible && <span className="inv-status tone-green">Online SC/PWD eligible</span>}
          {!item.available && reason && <span className="menu-badge-warning"><AlertTriangle size={13} /> {reason.label}</span>}
        </div>
        <p className="menu-card-meta">Updated {timeAgo(item.updatedAt)}</p>
        <div className="menu-card-actions">
          <button type="button" className="ops-secondary-action" onClick={onEdit} disabled={busy}><Pencil size={14} /> Edit</button>
          <button type="button" className={item.manualAvailable ? 'ops-destructive-action' : 'ops-secondary-action'} onClick={onToggleAvailability} disabled={busy}>{item.manualAvailable ? 'Mark Unavailable' : 'Mark Available'}</button>
        </div>
      </div>
    </article>
  )
}

function ItemDrawer({ item, onClose, onEdit, onToggleAvailability }) {
  const [recipe, setRecipe] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    fetchMenuItemRecipe(item.id).then((r) => { if (active) setRecipe(r) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [item.id])
  const reason = item.unavailableReason ? REASON_META[item.unavailableReason] : null
  return (
    <div className="ops-drawer-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <aside className="ops-drawer" role="dialog" aria-modal="true" aria-labelledby="menu-drawer-title">
        <header><div><span className="settings-kicker">{item.mainCategory}</span><h2 id="menu-drawer-title">{item.name}</h2></div><button type="button" onClick={onClose} aria-label="Close item details"><X size={20} /></button></header>
        <div className="ops-drawer-body">
          <section><h3>Overview</h3>
            <p><b>{money(item.price)}</b> <span className={`inv-status tone-${item.available ? 'green' : 'red'}`}>{item.available ? 'Available' : 'Unavailable'}</span></p>
            {!item.available && reason && <p className="menu-badge-warning"><AlertTriangle size={13} /> {reason.label}</p>}
            <p>{item.description || 'No description yet.'}</p>
          </section>
          <section><h3>Details</h3>
            <p>Category: {item.mainCategory} · {item.subcategory || '—'}</p>
            <p>Type: {item.itemType}</p>
            <p>Online SC/PWD discount: {item.onlineBenefitEligible ? 'Eligible' : 'Not eligible'}</p>
            <p>Temperature: {TEMP_LABEL[item.temperatureType]}</p>
            {item.prepTimeMinutes ? <p>Prep time: {item.prepTimeMinutes} min</p> : null}
          </section>
          <section><h3>Recipe</h3>
            {loading ? <p className="ops-proof-pending">Loading…</p> : recipe.length === 0 ? <p className="ops-proof-pending">No recipe linked yet.</p> : (
              <ul className="inv-movement-list">{recipe.map((r) => <li key={r.ingredient_id}><b>{r.ingredients?.name || 'Ingredient'}</b><span>{r.quantity_per_serving} {r.unit || r.ingredients?.unit || ''} per serving</span></li>)}</ul>
            )}
          </section>
        </div>
        <footer className="ops-drawer-footer">
          <button type="button" className="ops-main-action" onClick={onEdit}><Pencil size={16} /> Edit</button>
          <button type="button" className="ops-secondary-action" onClick={onToggleAvailability}>{item.manualAvailable ? 'Mark Unavailable' : 'Mark Available'}</button>
        </footer>
      </aside>
    </div>
  )
}

function ItemFormModal({ item, mainCategories, subcategories, onClose, onDelete, onSave }) {
  const draftScope = `staff:menu:${item?.id || 'new'}:draft`
  const defaultSaleOption = item?.variantOptions?.options?.[0] || { key: 'default', name: item?.itemType === 'drink' ? 'Serving' : 'Piece', quantity: 1, unit: item?.itemType === 'drink' ? 'serving' : 'piece', price: item?.price ?? '' }
  const [values, setValues, clearValues] = useManagementSessionState(`${draftScope}:values`, {
    name: item?.name || '', description: item?.description || '', mainCategoryId: item?.mainCategoryId || mainCategories[0]?.id || '',
    subcategoryId: item?.subcategoryId || '', price: item?.price ?? '', itemType: item?.itemType || 'food', temperatureType: item?.temperatureType || 'none',
    allowIce: item?.allowIce ?? false, allowSugar: item?.allowSugar ?? false, allowAddons: item?.allowAddons ?? false,
    onlineBenefitEligible: item?.onlineBenefitEligible ?? false,
    imageUrl: item?.imageUrl || '', manualAvailable: item?.manualAvailable ?? true, isFeatured: item?.isFeatured ?? false, isBestseller: item?.isBestseller ?? false,
    prepTimeMinutes: item?.prepTimeMinutes ?? '', inventorySource: item?.inventorySource || 'none',
    sellingOptions: item?.variantOptions?.options?.length ? item.variantOptions.options : [defaultSaleOption],
    allowSellingOptions: Boolean(item?.variantOptions?.enabled),
    presetBundle: Boolean(item?.variantOptions?.presetBundle || item?.variantOptions?.options?.some((option) => option.key === 'bundle-default')),
    bundleName: item?.variantOptions?.bundleName || item?.variantOptions?.options?.find((option) => option.key === 'bundle-default')?.name || item?.name || '', bundleQuantity: item?.variantOptions?.bundleQuantity || item?.variantOptions?.options?.find((option) => option.key === 'bundle-default')?.quantity || 1,
    bundleUnit: item?.variantOptions?.bundleUnit || item?.variantOptions?.options?.find((option) => option.key === 'bundle-default')?.unit || 'piece',
    ingredientBom: [], productBom: [],
  })
  const [imagePreview, setImagePreview, clearImagePreview] = useManagementSessionState(`${draftScope}:image`, item?.image || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ingredients, setIngredients] = useState([])
  const [products, setProducts] = useState([])
  useEffect(() => { Promise.all([fetchIngredientOptions(), fetchFinishedProductOptions(), item ? fetchMenuItemRecipe(item.id) : Promise.resolve([]), item ? fetchMenuItemProductLinks(item.id) : Promise.resolve([])]).then(([i, p, r, l]) => { setIngredients(i); setProducts(p); set('ingredientBom', r.map((x) => ({ ingredientId: x.ingredient_id, quantity: x.quantity_per_serving }))); set('productBom', l.map((x) => ({ productId: x.finished_product_id, optionKey: x.variant_key || '' }))) }).catch((cause) => setError(describeError(cause, 'Could not load inventory links.'))); }, [item?.id])
  const [section, setSection, clearSection] = useManagementSessionState(`${draftScope}:section`, 'basics')
  const fileRef = useRef(null)
  const set = (key, value) => setValues((c) => ({ ...c, [key]: value }))
  const close = () => { clearValues(); clearImagePreview(); clearSection(); onClose() }
  useEffect(() => { if (!values.presetBundle) return; const limit = Math.max(1, Number(values.bundleQuantity) || 1); if (values.productBom.length > limit) set('productBom', values.productBom.slice(0, limit)) }, [values.presetBundle, values.bundleQuantity])

  const availableSubcategories = useMemo(() => subcategories.filter((s) => !s.is_archived && s.main_category_id === values.mainCategoryId), [subcategories, values.mainCategoryId])

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true); setError('')
    try {
      const url = await uploadMenuItemImage(file)
      set('imageUrl', url)
      setImagePreview(url)
    } catch (cause) {
      setError(describeError(cause, 'Could not upload the image.'))
    } finally {
      setUploading(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!values.name.trim()) { setSection('basics'); return setError('Item name is required.') }
    const price = Number(values.price)
    if (Number.isNaN(price) || price < 0) { setSection('basics'); return setError('Price must be zero or greater.') }
    if (values.inventorySource === 'ingredients' && values.ingredientBom.some((row) => !row.ingredientId || Number(row.quantity) <= 0)) { setSection('bom'); return setError('Each ingredient link needs an ingredient and a quantity greater than zero.') }
    if (values.presetBundle && (!values.bundleName.trim() || Number(values.bundleQuantity) <= 0 || !values.bundleUnit.trim())) { setSection('options'); return setError('Preset bundles need a name, total quantity, and unit.') }
    if (values.inventorySource === 'products' && values.presetBundle && (!values.productBom.length || values.productBom.some((row) => !row.productId))) { setSection('bom'); return setError('Add each preset flavor/product before saving.') }
    if (values.inventorySource === 'products' && values.presetBundle && values.productBom.length > Number(values.bundleQuantity)) { setSection('bom'); return setError(`A ${values.bundleQuantity}-piece bundle can have at most ${values.bundleQuantity} preset product rows.`) }
    if (values.inventorySource === 'products' && !values.presetBundle && (!values.sellingOptions.length || values.sellingOptions.some((row) => !row.name?.trim() || Number(row.quantity) <= 0 || !row.unit?.trim() || Number(row.price) < 0))) { setSection('options'); return setError('Product-linked items need a complete default sale format or selling option.') }
    setSaving(true); setError('')
    try {
      if (values.presetBundle) values.productBom.forEach((row) => { row.optionKey = 'bundle-default' })
      const options = values.presetBundle ? [{ key: 'bundle-default', name: values.bundleName.trim(), quantity: Number(values.bundleQuantity), unit: values.bundleUnit.trim(), price }] : values.sellingOptions.map((row, index) => ({ key: row.key || `option-${index + 1}`, name: row.name.trim(), quantity: Number(row.quantity), unit: row.unit.trim(), price: Number(row.price) }))
      if (values.presetBundle) values.sellingOptions = options
      await onSave({ id: item?.id, ...values, price: values.allowSellingOptions && options.length ? options[0].price : price, sellingOptions: options, variantOptions: { enabled: Boolean(values.allowSellingOptions), type: 'selling_options', options, labels: Object.fromEntries(options.map((x) => [x.key, x.name])), prices: Object.fromEntries(options.map((x) => [x.key, x.price])), quantities: Object.fromEntries(options.map((x) => [x.key, x.quantity])), units: Object.fromEntries(options.map((x) => [x.key, x.unit])) }, onlineBenefitEligible: values.onlineBenefitEligible ?? item?.onlineBenefitEligible ?? false, prepTimeMinutes: values.prepTimeMinutes === '' ? null : Number(values.prepTimeMinutes), availableFrom: null, availableUntil: null, ingredients: values.ingredientBom.map((x) => ({ ingredient_id: x.ingredientId, quantity_per_serving: Number(x.quantity) })), products: values.productBom.map((x) => ({ finished_product_id: x.productId, variant_key: x.optionKey || null })) })
      clearValues(); clearImagePreview(); clearSection()
    } catch (cause) {
      if (cause?.code !== 'APPROVAL_CANCELLED') setError(describeError(cause, 'Could not save this item.'))
      setSaving(false)
    }
  }

  return (
    <div className="payment-modal-backdrop ops-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) close() }} onKeyDown={(e) => { if (e.key === 'Escape' && !saving) close() }}>
      <section className="payment-modal inv-form-modal menu-form-modal menu-workspace-modal ops-popup-modal" role="dialog" aria-modal="true" aria-labelledby="menu-form-title">
        <button className="payment-modal-close" type="button" onClick={close} disabled={saving} aria-label="Close item editor"><X size={18} /></button>
        <header className="menu-workspace-header">
          <span className="payment-modal-kicker">{item ? 'Edit menu item' : 'New menu item'}</span>
          <h2 id="menu-form-title">{item ? item.name : 'Add a new menu item'}</h2>
        </header>
        <form className="menu-editor-form" onSubmit={submit}>
          <div className="menu-editor-layout">
            <nav className="menu-editor-nav" role="tablist" aria-label="Item editor sections">
              <button type="button" role="tab" aria-selected={section === 'basics'} aria-controls="menu-editor-basics" className={section === 'basics' ? 'active' : ''} onClick={() => setSection('basics')}><ImagePlus size={18} /><span><b>Basics</b><small>Name, image, and category</small></span></button>
              <button type="button" role="tab" aria-selected={section === 'options'} aria-controls="menu-editor-options" className={section === 'options' ? 'active' : ''} onClick={() => setSection('options')}><SlidersHorizontal size={18} /><span><b>Options</b><small>Availability and choices</small></span></button>
              <button type="button" role="tab" aria-selected={section === 'bom'} aria-controls="menu-editor-bom" className={section === 'bom' ? 'active' : ''} onClick={() => setSection('bom')}><Box size={18} /><span><b>BOM</b><small>Inventory links</small></span></button>
            </nav>
            <div className="menu-editor-panel">
              {section === 'basics' && (
                <section id="menu-editor-basics" role="tabpanel" className="menu-form-section" aria-label="Basic item details">
                  <header className="menu-basics-discount-header"><div><h3>Basic details</h3><p>The information customers use to identify this item.</p></div><div className="menu-online-discount-control"><span id="menu-online-discount-label">Online SC/PWD discount</span><button type="button" role="switch" aria-checked={values.onlineBenefitEligible ?? item?.onlineBenefitEligible ?? false} aria-labelledby="menu-online-discount-label" aria-describedby="menu-online-discount-hint" className="menu-online-discount-switch" onClick={() => set('onlineBenefitEligible', !(values.onlineBenefitEligible ?? item?.onlineBenefitEligible ?? false))} disabled={saving}><i aria-hidden="true"/><span>{(values.onlineBenefitEligible ?? item?.onlineBenefitEligible ?? false) ? 'On' : 'Off'}</span></button><small id="menu-online-discount-hint">Save changes to request approval.</small></div></header>
                  <div className="menu-image-upload menu-image-upload-card">
                    {imagePreview ? <img src={imagePreview} alt={`${values.name || 'Menu item'} preview`} /> : <div className="menu-image-placeholder"><ImagePlus size={24} /></div>}
                    <div><b>Menu photo</b><p>Use a clear square image. JPG, PNG, or WEBP up to 5MB.</p><button type="button" className="ops-secondary-action compact" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? 'Uploading…' : imagePreview ? 'Replace image' : 'Upload image'}</button><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFile} /></div>
                  </div>
                  <div className="form-grid menu-form-grid">
                    <label className="field"><span>Item name</span><input autoFocus value={values.name} maxLength={80} onChange={(e) => set('name', sanitizeCatalogText(e.target.value, 80))} placeholder="e.g. Spanish Latte" required /></label>
                    <label className="field"><span>Menu price incl. VAT (PHP)</span><input type="number" min="0" step="0.01" value={values.price} onChange={(e) => set('price', e.target.value)} placeholder="0.00" required /></label>
                    <label className="field"><span>Main category</span><select value={values.mainCategoryId} onChange={(e) => { set('mainCategoryId', e.target.value); set('subcategoryId', '') }}>{mainCategories.filter((c) => !c.is_archived).map((c) => <option key={c.id} value={c.id}>{c.display_name || c.name}</option>)}</select></label>
                    <label className="field"><span>Subcategory</span><select value={values.subcategoryId} onChange={(e) => set('subcategoryId', e.target.value)}><option value="">No subcategory</option>{availableSubcategories.map((s) => <option key={s.id} value={s.id}>{s.display_name || s.name}</option>)}</select></label>
                    <label className="field"><span>Item type</span><select value={values.itemType} onChange={(e) => set('itemType', e.target.value)}><option value="drink">Drink</option><option value="food">Food</option></select></label>
                    <label className="field"><span>Prep time (minutes)</span><input type="number" min="0" value={values.prepTimeMinutes} onChange={(e) => set('prepTimeMinutes', e.target.value)} placeholder="e.g. 10" /><small>Used by staff as preparation guidance.</small></label>
                  </div>
                  <label className="field menu-description-field"><span>Description</span><textarea rows="3" maxLength={500} value={values.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the flavor, ingredients, or serving style." /></label>
                </section>
              )}
              {section === 'options' && (
                <section id="menu-editor-options" role="tabpanel" className="menu-form-section" aria-label="Item options">
                  <header><h3>Availability and options</h3><p>Choose how this item appears and what customers can customize.</p></header>
                  <label className="field menu-temperature-field"><span>Temperature</span><select value={values.temperatureType} onChange={(e) => set('temperatureType', e.target.value)}><option value="none">Not applicable</option><option value="hot_only">Hot only</option><option value="iced_only">Iced only</option><option value="flexible">Hot or iced</option></select><small>This controls which temperature choices customers see.</small></label>
                  <fieldset className="menu-option-group"><legend>Menu status</legend><div className="menu-option-grid">
                    <label className="menu-option-card"><input type="checkbox" checked={values.manualAvailable} onChange={(e) => set('manualAvailable', e.target.checked)} /><span><b>Available</b><small>Customers can order this item.</small></span></label>
                    <label className="menu-option-card"><input type="checkbox" checked={values.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} /><span><b>Featured</b><small>Give the item extra visibility.</small></span></label>
                    <label className="menu-option-card"><input type="checkbox" checked={values.isBestseller} onChange={(e) => set('isBestseller', e.target.checked)} /><span><b>Bestseller</b><small>Show the bestseller marker.</small></span></label>
                  </div></fieldset>
                  <fieldset className="menu-option-group"><legend>Customer customization</legend><div className="menu-option-grid">
                    <label className="menu-option-card"><input type="checkbox" checked={values.allowIce} onChange={(e) => set('allowIce', e.target.checked)} /><span><b>Ice levels</b><small>Let customers choose ice amount.</small></span></label>
                    <label className="menu-option-card"><input type="checkbox" checked={values.allowSugar} onChange={(e) => set('allowSugar', e.target.checked)} /><span><b>Sugar levels</b><small>Let customers adjust sweetness.</small></span></label>
                    <label className="menu-option-card"><input type="checkbox" checked={values.allowAddons} onChange={(e) => set('allowAddons', e.target.checked)} /><span><b>Add-ons</b><small>Allow compatible extras.</small></span></label>
                  </div></fieldset>
                  <fieldset className="menu-option-group"><legend>Selling options</legend><label className="menu-option-card"><input type="checkbox" checked={values.allowSellingOptions} onChange={(e) => set('allowSellingOptions', e.target.checked)} /><span><b>Allow additional selling options</b><small>The default sale format is always available. Turn this on to add formats such as boxes or whole cakes.</small></span></label>
                    <div className="menu-default-option-note"><b>Default: {values.sellingOptions[0]?.name || 'Piece'}</b><span>{values.sellingOptions[0]?.quantity || 1} {values.sellingOptions[0]?.unit || 'piece'} · {money(Number(values.sellingOptions[0]?.price || values.price || 0))}</span></div>
                    {values.allowSellingOptions && <div className="menu-selling-options">{values.sellingOptions.slice(1).map((option, index) => <div className="menu-selling-option-row" key={option.key || index}><input value={option.name || ''} onChange={(e) => set('sellingOptions', values.sellingOptions.map((x, i) => i === index + 1 ? { ...x, name: e.target.value } : x))} placeholder="Displayed name" aria-label="Selling option name" /><input type="number" min="0.001" step="any" value={option.quantity ?? ''} onChange={(e) => set('sellingOptions', values.sellingOptions.map((x, i) => i === index + 1 ? { ...x, quantity: e.target.value } : x))} placeholder="Quantity" aria-label="Selling option quantity" /><input value={option.unit || ''} onChange={(e) => set('sellingOptions', values.sellingOptions.map((x, i) => i === index + 1 ? { ...x, unit: e.target.value } : x))} placeholder="Unit name" aria-label="Selling option unit" /><input type="number" min="0" step="0.01" value={option.price ?? ''} onChange={(e) => set('sellingOptions', values.sellingOptions.map((x, i) => i === index + 1 ? { ...x, price: e.target.value } : x))} placeholder="Price" aria-label="Selling option price" /><button type="button" className="ops-secondary-action compact" onClick={() => set('sellingOptions', values.sellingOptions.filter((_, i) => i !== index + 1))}>Remove</button></div>)}<button type="button" className="ops-secondary-action compact" onClick={() => set('sellingOptions', [...values.sellingOptions, { key: `option-${Date.now()}`, name: '', quantity: 1, unit: values.sellingOptions[0]?.unit || 'piece', price: '' }])}><Plus size={14} /> Add selling option</button></div>}
                  </fieldset>
                  <fieldset className="menu-option-group"><legend>Preset bundle</legend><label className="menu-option-card"><input type="checkbox" checked={values.presetBundle} onChange={(e) => set('presetBundle', e.target.checked)} /><span><b>Use a staff-defined preset bundle</b><small>For Bestseller Boxes, Sampler Boxes, and other fixed contents. Customers will not choose flavors.</small></span></label>{values.presetBundle && <div className="menu-bundle-fields"><label className="field"><span>Bundle name</span><input value={values.bundleName} onChange={(e) => set('bundleName', e.target.value)} placeholder="e.g. Bestseller Box" /></label><label className="field"><span>Total quantity</span><input type="number" min="1" step="1" value={values.bundleQuantity} onChange={(e) => set('bundleQuantity', e.target.value)} /></label><label className="field"><span>Unit name</span><input value={values.bundleUnit} onChange={(e) => set('bundleUnit', e.target.value)} placeholder="piece" /></label></div>}</fieldset>
                </section>
              )}
              {section === 'bom' && <section id="menu-editor-bom" role="tabpanel" className="menu-form-section" aria-label="Bills of materials"><header><h3>BOM · Bills of materials</h3><p>Choose one inventory source. Links can be reused across many menu items and products.</p></header><label className="field"><span>Inventory source</span><select value={values.inventorySource} onChange={(e) => set('inventorySource', e.target.value)}><option value="none">Not linked</option><option value="ingredients">Ingredients</option><option value="products">Products</option></select></label>{values.inventorySource === 'ingredients' && <div className="menu-bom-list">{values.ingredientBom.map((row, index) => <div className="menu-bom-row" key={index}><select value={row.ingredientId || ''} onChange={(e) => set('ingredientBom', values.ingredientBom.map((x, i) => i === index ? { ...x, ingredientId: e.target.value } : x))}><option value="">Select ingredient</option>{ingredients.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.unit})</option>)}</select><input type="number" min="0.001" step="any" value={row.quantity ?? ''} onChange={(e) => set('ingredientBom', values.ingredientBom.map((x, i) => i === index ? { ...x, quantity: e.target.value } : x))} placeholder="Quantity per sale" /><button type="button" className="ops-secondary-action compact" onClick={() => set('ingredientBom', values.ingredientBom.filter((_, i) => i !== index))}>Remove</button></div>)}<button type="button" className="ops-secondary-action compact" onClick={() => set('ingredientBom', [...values.ingredientBom, { ingredientId: '', quantity: '' }])}><Plus size={14} /> Add ingredient</button></div>}{values.inventorySource === 'products' && <div className="menu-bom-list"><h4 className="menu-bom-subtitle">Preset box contents</h4><p className="menu-form-hint">Add each product included in the selected selling option. Customers and cashier POS will see only the box name and fixed price.</p>{values.productBom.map((row, index) => { const option = values.sellingOptions.find((x) => (x.key || '') === row.optionKey); const deductionQuantity = values.presetBundle ? 1 : option?.quantity; return <div className="menu-bom-row" key={index}><select value={row.optionKey || ''} onChange={(e) => set('productBom', values.productBom.map((x, i) => i === index ? { ...x, optionKey: e.target.value } : x))}><option value="">Select selling option</option>{values.sellingOptions.map((x, i) => <option key={x.key || i} value={x.key || `option-${i + 1}`}>{x.name || `Option ${i + 1}`} · {x.quantity || '—'} {x.unit || ''}</option>)}</select><select value={row.productId || ''} onChange={(e) => set('productBom', values.productBom.map((x, i) => i === index ? { ...x, productId: e.target.value } : x))}><option value="">Select included product</option>{products.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.unit})</option>)}</select>{option && <span className="menu-bom-quantity">Deducts {deductionQuantity} {option.unit}</span>}<button type="button" className="ops-secondary-action compact" onClick={() => set('productBom', values.productBom.filter((_, i) => i !== index))}>Remove</button></div>})}<button type="button" className="ops-secondary-action compact" onClick={() => { if (values.presetBundle && values.productBom.length >= Number(values.bundleQuantity)) return; set('productBom', [...values.productBom, { optionKey: 'bundle-default', productId: '' }]) }} disabled={values.presetBundle && values.productBom.length >= Number(values.bundleQuantity)}><Plus size={14} /> Add preset product</button></div>}</section>}
            </div>
          </div>
          {error && <p className="form-error menu-workspace-error" role="alert">{error}</p>}
          <div className="payment-modal-actions menu-workspace-actions">
            {item && !item.isArchived && <button className="ops-destructive-action compact menu-form-delete-button" type="button" onClick={onDelete} disabled={saving || uploading}><Archive size={15} /> Delete item</button>}
            <button className="secondary-button" type="button" onClick={close} disabled={saving}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving || uploading}>{saving ? 'Saving…' : item ? 'Save changes' : 'Add item'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function CategoryManagerModal({ mainCategories, subcategories, onClose, onChanged, pushToast, requestApproval }) {
  const [tab, setTab, clearTab] = useManagementSessionState('staff:menu:category-draft:tab', 'main')
  const [name, setName, clearName] = useManagementSessionState('staff:menu:category-draft:name', '')
  const [displayName, setDisplayName, clearDisplayName] = useManagementSessionState('staff:menu:category-draft:display-name', '')
  const [parentId, setParentId, clearParentId] = useManagementSessionState('staff:menu:category-draft:parent', mainCategories.find((category) => !category.is_archived)?.id || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const close = () => { clearTab(); clearName(); clearDisplayName(); clearParentId(); onClose() }

  const addMain = async (event) => {
    event.preventDefault()
    if (!name.trim()) return setError('Name is required.')
    setSaving(true); setError('')
    try {
      await requestApproval({ action: 'add', itemName: displayName || name, summary: 'Add a main menu category', changeTypes: ['New category'], operationKey: 'upsert_main_category', payload: { name, displayName } }, () => upsertMainCategory({ name, displayName }))
      setName(''); setDisplayName('')
      pushToast('success', 'Category sent for admin review.')
    } catch (cause) { if (cause?.code !== 'APPROVAL_CANCELLED') setError(describeError(cause, 'Could not save category.')) } finally { setSaving(false) }
  }
  const addSub = async (event) => {
    event.preventDefault()
    if (!name.trim()) return setError('Name is required.')
    setSaving(true); setError('')
    try {
      await requestApproval({ action: 'add', itemName: displayName || name, summary: 'Add a menu subcategory', changeTypes: ['New category'], operationKey: 'upsert_subcategory', payload: { name, displayName: displayName || name, mainCategoryId: parentId || null } }, () => upsertSubcategory({ name, displayName, mainCategoryId: parentId || null }))
      setName(''); setDisplayName('')
      pushToast('success', 'Subcategory sent for admin review.')
    } catch (cause) { if (cause?.code !== 'APPROVAL_CANCELLED') setError(describeError(cause, 'Could not save subcategory.')) } finally { setSaving(false) }
  }
  const archive = async (fn, id, label) => {
    try { const operationKey = fn === archiveMainCategory ? 'archive_main_category' : 'archive_subcategory'; await requestApproval({ action: 'remove', itemName: label, summary: 'Archive this menu category', changeTypes: ['Item removal'], operationKey, payload: { id } }, () => fn(id)); pushToast('success', `${label} removal sent for admin review.`) }
    catch (cause) { pushToast('error', describeError(cause, `Could not archive ${label.toLowerCase()}.`)) }
  }

  const activeMainCategories = mainCategories.filter((category) => !category.is_archived)
  const activeSubcategories = subcategories.filter((category) => !category.is_archived)
  const visibleCategories = tab === 'main' ? activeMainCategories : activeSubcategories
  const changeTab = (nextTab) => { setTab(nextTab); setError(''); setName(''); setDisplayName('') }

  return (
    <div className="payment-modal-backdrop ops-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) close() }} onKeyDown={(e) => { if (e.key === 'Escape' && !saving) close() }}>
      <section className="payment-modal inv-form-modal category-workspace-modal ops-popup-modal" role="dialog" aria-modal="true" aria-labelledby="category-manager-title">
        <button className="payment-modal-close" type="button" onClick={close} disabled={saving} aria-label="Close category manager"><X size={18} /></button>
        <header className="menu-workspace-header">
          <span className="payment-modal-kicker">Menu organization</span>
          <h2 id="category-manager-title">Categories and subcategories</h2>
        </header>
        <nav className="category-workspace-tabs" role="tablist" aria-label="Category type">
          <button type="button" role="tab" aria-selected={tab === 'main'} aria-controls="category-main-panel" className={tab === 'main' ? 'active' : ''} onClick={() => changeTab('main')}><Folder size={18} /><span><b>Main categories</b><small>Top-level menu groups</small></span><strong>{activeMainCategories.length}</strong></button>
          <button type="button" role="tab" aria-selected={tab === 'sub'} aria-controls="category-sub-panel" className={tab === 'sub' ? 'active' : ''} onClick={() => changeTab('sub')}><Tags size={18} /><span><b>Subcategories</b><small>Groups inside categories</small></span><strong>{activeSubcategories.length}</strong></button>
        </nav>
        <div className="category-workspace-grid" id={tab === 'main' ? 'category-main-panel' : 'category-sub-panel'} role="tabpanel">
          <section className="category-list-panel">
            <header><div><h3>{tab === 'main' ? 'Main categories' : 'Subcategories'}</h3><p>{visibleCategories.length} active {visibleCategories.length === 1 ? 'group' : 'groups'}</p></div></header>
            {visibleCategories.length === 0 ? (
              <div className="category-empty-state"><Tags size={24} /><b>No {tab === 'main' ? 'categories' : 'subcategories'} yet</b><p>Use the form beside this list to create the first one.</p></div>
            ) : (
              <ul className="menu-category-list category-workspace-list">
                {visibleCategories.map((category) => {
                  const parent = mainCategories.find((main) => main.id === category.main_category_id)
                  return (
                    <li key={category.id}>
                      <span className="category-row-icon" aria-hidden="true">{tab === 'main' ? <Folder size={17} /> : <Tags size={17} />}</span>
                      <span className="category-row-copy"><b>{category.display_name || category.name}</b><small>{tab === 'sub' ? `Under ${parent?.display_name || parent?.name || 'Unassigned'}` : `Internal name: ${category.name}`}</small></span>
                      <button type="button" className="ops-destructive-action compact" onClick={() => archive(tab === 'main' ? archiveMainCategory : archiveSubcategory, category.id, category.display_name || category.name)}>Archive</button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
          <aside className="category-create-panel">
            <header><span><Plus size={18} /></span><div><h3>Add {tab === 'main' ? 'a main category' : 'a subcategory'}</h3></div></header>
            <form onSubmit={tab === 'main' ? addMain : addSub}>
              {tab === 'sub' && <label className="field"><span>Parent category</span><select value={parentId} onChange={(e) => setParentId(e.target.value)} required>{activeMainCategories.map((category) => <option key={category.id} value={category.id}>{category.display_name || category.name}</option>)}</select><small>Where this subcategory will appear.</small></label>}
                  <label className="field"><span>Internal name</span><input autoFocus value={name} maxLength={40} onChange={(e) => setName(sanitizeCatalogText(e.target.value, 40))} placeholder={tab === 'main' ? 'e.g. drinks' : 'e.g. espresso'} required /><small>Use a short, unique system name.</small></label>
                  <label className="field"><span>Customer-facing name</span><input value={displayName} maxLength={60} onChange={(e) => setDisplayName(sanitizeCatalogText(e.target.value, 60))} placeholder={tab === 'main' ? 'e.g. Drinks' : 'e.g. Espresso'} /><small>Optional. Falls back to the internal name.</small></label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="primary-button category-add-button" type="submit" disabled={saving || (tab === 'sub' && activeMainCategories.length === 0)}>{saving ? 'Saving…' : `Add ${tab === 'main' ? 'category' : 'subcategory'}`}</button>
            </form>
          </aside>
        </div>
      </section>
    </div>
  )
}

function AddOnManagerModal({ mainCategories, subcategories, onClose, pushToast, requestApproval }) {
  const [addons, setAddons] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState({ id: '', name: '', price: '', isAvailable: true, subcategoryIds: [], sortOrder: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const activeMainCategories = useMemo(() => mainCategories.filter((category) => !category.is_archived), [mainCategories])
  const activeSubcategories = useMemo(() => subcategories.filter((category) => !category.is_archived), [subcategories])
  const groupedSubcategories = useMemo(() => activeMainCategories.map((main) => ({
    main,
    items: activeSubcategories.filter((subcategory) => subcategory.main_category_id === main.id),
  })).filter((group) => group.items.length), [activeMainCategories, activeSubcategories])
  const filteredAddons = useMemo(() => {
    const query = search.trim().toLowerCase()
    return addons.filter((addon) => !query || addon.name.toLowerCase().includes(query))
  }, [addons, search])
  const assignedSubcategoryCount = useMemo(() => new Set(addons.flatMap((addon) => addon.subcategoryIds || [])).size, [addons])

  const toDraft = (addon) => ({
    id: addon.id,
    name: addon.name || '',
    price: addon.price ?? '',
    isAvailable: Boolean(addon.is_available),
    subcategoryIds: addon.subcategoryIds || [],
    sortOrder: addon.sort_order ?? 0,
  })

  const loadAddons = async () => {
    setLoading(true)
    try {
      const rows = await fetchAddonOptions()
      setAddons(rows.map((row) => ({
        ...row,
        price: Number(row.price || 0),
        subcategoryIds: (row.addon_subcategories || []).map((link) => link.subcategory_id).filter(Boolean),
      })))
      setError('')
    } catch (cause) {
      setError(describeError(cause, 'Could not load add-ons.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAddons()
    const handleChange = () => loadAddons()
    window.addEventListener('menu-approval-requests-changed', handleChange)
    return () => window.removeEventListener('menu-approval-requests-changed', handleChange)
  }, [])

  useEffect(() => {
    if (!selectedId) return
    const selected = addons.find((addon) => addon.id === selectedId)
    if (selected) setDraft(toDraft(selected))
  }, [addons, selectedId])

  const startNew = () => {
    setSelectedId(null)
    setDraft({ id: '', name: '', price: '', isAvailable: true, subcategoryIds: [], sortOrder: 0 })
    setError('')
  }

  const selectAddon = (addon) => {
    setSelectedId(addon.id)
    setDraft(toDraft(addon))
    setError('')
  }

  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  const toggleSubcategory = (id) => setDraft((current) => ({
    ...current,
    subcategoryIds: current.subcategoryIds.includes(id)
      ? current.subcategoryIds.filter((subcategoryId) => subcategoryId !== id)
      : [...current.subcategoryIds, id],
  }))

  const submit = async (event) => {
    event.preventDefault()
    const name = draft.name.trim()
    const price = Number(draft.price)
    if (!name) return setError('Add-on name is required.')
    if (Number.isNaN(price) || price < 0) return setError('Price must be zero or greater.')
    if (!draft.subcategoryIds.length) return setError('Choose at least one menu subcategory.')
    setSaving(true)
    setError('')
    try {
      await requestApproval({
        action: draft.id ? 'change' : 'add',
        itemName: name,
        summary: draft.id ? 'Update an add-on and its menu subcategory placement' : 'Create an add-on and choose where it appears in the menu',
        changeTypes: ['Add-ons'],
        operationKey: 'upsert_addon',
        payload: {
          id: draft.id || null,
          name,
          price,
          appliesTo: 'both',
          isAvailable: Boolean(draft.isAvailable),
          sortOrder: draft.sortOrder ?? 0,
          subcategoryIds: draft.subcategoryIds,
        },
      }, () => Promise.resolve())
      pushToast('success', `${name} was sent for admin review.`)
      startNew()
    } catch (cause) {
      if (cause?.code !== 'APPROVAL_CANCELLED') setError(describeError(cause, 'Could not submit this add-on.'))
    } finally {
      setSaving(false)
    }
  }

  const addonSubcategoryNames = (addon) => (addon.subcategoryIds || [])
    .map((id) => activeSubcategories.find((subcategory) => subcategory.id === id)?.display_name || activeSubcategories.find((subcategory) => subcategory.id === id)?.name)
    .filter(Boolean)

  return (
    <div className="payment-modal-backdrop ops-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }} onKeyDown={(event) => { if (event.key === 'Escape' && !saving) onClose() }}>
      <section className="payment-modal inv-form-modal addon-workspace-modal ops-popup-modal" role="dialog" aria-modal="true" aria-labelledby="addon-manager-title">
        <button className="payment-modal-close" type="button" onClick={onClose} disabled={saving} aria-label="Close add-on manager"><X size={18} /></button>
        <header className="menu-workspace-header addon-workspace-header">
          <span className="payment-modal-kicker">Menu customization</span>
          <h2 id="addon-manager-title">Manage add-ons</h2>
        </header>
        <div className="addon-summary-strip" aria-label="Add-on overview">
          <div><strong>{addons.filter((addon) => addon.is_available).length}</strong><span>Available add-ons</span></div>
          <div><strong>{addons.length}</strong><span>Total add-ons</span></div>
          <div><strong>{assignedSubcategoryCount}</strong><span>Subcategories covered</span></div>
        </div>
        <div className="addon-workspace-grid">
          <section className="addon-list-panel" aria-labelledby="addon-list-title">
            <header className="addon-list-toolbar">
              <div><h3 id="addon-list-title">Your add-ons</h3></div>
              <button type="button" className="ops-secondary-action compact" onClick={startNew}><Plus size={14} /> New add-on</button>
            </header>
            <label className="menu-manage-search addon-list-search">
              <Search size={16} /><span className="sr-only">Search add-ons</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search add-ons" />
              {search && <button type="button" className="menu-manage-search-clear" aria-label="Clear add-on search" onClick={() => setSearch('')}><X size={14} /></button>}
            </label>
            {loading ? <div className="addon-empty-state"><RefreshCw size={20} className="spin" /><span>Loading add-ons…</span></div> : filteredAddons.length === 0 ? (
              <div className="addon-empty-state"><Sparkles size={22} /><b>{search ? 'No add-ons found' : 'No add-ons yet'}</b><span>{search ? 'Try another search.' : 'Use New add-on to create your first reusable extra.'}</span></div>
            ) : (
              <ul className="addon-list">
                {filteredAddons.map((addon) => {
                  const scopes = addonSubcategoryNames(addon)
                  return <li key={addon.id} className={`addon-row ${selectedId === addon.id ? 'active' : ''}`}>
                    <span className="addon-row-icon" aria-hidden="true"><Sparkles size={17} /></span>
                    <span className="addon-row-copy"><b>{addon.name}</b><span>{money(addon.price)}</span><span className="addon-scope-badges">{scopes.slice(0, 3).map((scope) => <em key={scope}>{scope}</em>)}{scopes.length > 3 && <em>+{scopes.length - 3} more</em>}{!scopes.length && <em>Needs placement</em>}</span></span>
                    <span className="addon-row-actions"><span className={`addon-availability ${addon.is_available ? 'available' : 'unavailable'}`}>{addon.is_available ? 'Available' : 'Hidden'}</span><button type="button" className="ops-secondary-action compact" onClick={() => selectAddon(addon)}><Pencil size={14} /> Edit</button></span>
                  </li>
                })}
              </ul>
            )}
          </section>
          <aside className="addon-edit-panel">
            <header className="addon-edit-header"><span className="addon-edit-icon"><Sparkles size={18} /></span><div><span className="payment-modal-kicker">{draft.id ? 'Edit add-on' : 'New add-on'}</span><h3>{draft.id ? 'Update this extra' : 'Create a reusable extra'}</h3></div></header>
            <form className="addon-edit-form" onSubmit={submit}>
              <div className="addon-form-grid">
                <label className="field addon-name-field"><span>Add-on name</span><input autoFocus={!draft.id} value={draft.name} maxLength={80} onChange={(event) => updateDraft('name', sanitizeCatalogText(event.target.value, 80))} placeholder="e.g. Oat milk" required /></label>
                <label className="field"><span>Price (PHP)</span><input type="number" min="0" step="0.01" value={draft.price} onChange={(event) => updateDraft('price', event.target.value)} placeholder="0.00" required /></label>
              </div>
              <label className="addon-availability-toggle"><input type="checkbox" checked={draft.isAvailable} onChange={(event) => updateDraft('isAvailable', event.target.checked)} /><span><b>Available in ordering screens</b></span></label>
              <fieldset className="addon-category-picker"><legend>Show in menu subcategories</legend>{groupedSubcategories.length ? <div className="addon-category-groups">{groupedSubcategories.map((group) => <section className="addon-category-group" key={group.main.id}><h4>{group.main.display_name || group.main.name}</h4><div className="addon-category-options">{group.items.map((subcategory) => <label className={`addon-category-option ${draft.subcategoryIds.includes(subcategory.id) ? 'active' : ''}`} key={subcategory.id}><input type="checkbox" checked={draft.subcategoryIds.includes(subcategory.id)} onChange={() => toggleSubcategory(subcategory.id)} /><span><b>{subcategory.display_name || subcategory.name}</b></span></label>)}</div></section>)}</div> : <div className="addon-picker-empty">Create an active subcategory first, then assign this add-on to it.</div>}</fieldset>
              {draft.subcategoryIds.length > 0 && <p className="addon-selection-count"><Check size={15} /> Shown in {draft.subcategoryIds.length} {draft.subcategoryIds.length === 1 ? 'subcategory' : 'subcategories'}</p>}
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="addon-form-actions"><button type="button" className="secondary-button" onClick={startNew} disabled={saving}>Clear</button><button type="submit" className="primary-button" disabled={saving || !groupedSubcategories.length}>{saving ? 'Sending…' : draft.id ? 'Send changes for review' : 'Send for admin review'}</button></div>
            </form>
          </aside>
        </div>
      </section>
    </div>
  )
}
