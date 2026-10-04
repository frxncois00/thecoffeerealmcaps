import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CalendarDays, Check, ChevronDown, Download, FileText, Printer, SlidersHorizontal } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { ReportShell as AppShell, Segments } from '../components/reports/ReportUI'
import { SalesOverview, ProductOverview, TrendsOverview } from '../components/reports/SalesReportContent'
import { describeError } from '../utils/describeError'
import { getCurrentPortalSession } from '../lib/auth'
import { supabase } from '../lib/supabase'
import {
  applyLocalFilters, buildTrend, computeProductMomentum, computeSalesReport, exportSalesReportCsv,
  fetchSalesReportData, ORDER_TYPE_LABEL, PAYMENT_LABEL, printSalesReportPdf,
} from '../services/salesReportService'
import { hasManagementSessionState, useManagementSessionState } from '../hooks/useManagementSessionState'
import '../sales-report.css'

const PERIOD_OPTIONS = [
  ['today', 'Today'],
  ['week', 'Week'],
  ['month', 'Month'],
  ['year', 'Year'],
  ['custom', 'Custom'],
]

const ANALYTICS_TABS = [{ key: 'products', label: 'Product Momentum' }, { key: 'trends', label: 'Sales Trends' }]

function startOfDay(date) { const d = new Date(date); d.setHours(0, 0, 0, 0); return d }
function endOfDay(date) { const d = new Date(date); d.setHours(23, 59, 59, 999); return d }

function rangeForPeriod(period) {
  const now = new Date()
  if (period === 'today') return { from: startOfDay(now), to: endOfDay(now) }
  if (period === 'week') {
    const start = startOfDay(now)
    start.setDate(start.getDate() - start.getDay())
    return { from: start, to: endOfDay(now) }
  }
  if (period === 'year') return { from: new Date(now.getFullYear(), 0, 1), to: endOfDay(now) }
  return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) }
}

function previousRange(from, to) {
  const length = to.getTime() - from.getTime() + 1
  return { prevFrom: new Date(from.getTime() - length), prevTo: new Date(from.getTime() - 1) }
}

function dateInputValue(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildAppliedFilters(period, fromInput, toInput) {
  let from
  let to
  if (period === 'custom') {
    from = fromInput ? new Date(`${fromInput}T00:00:00`) : startOfDay(new Date())
    to = toInput ? new Date(`${toInput}T23:59:59.999`) : endOfDay(new Date())
    if (from > to) { const swapped = from; from = startOfDay(to); to = endOfDay(swapped) }
  } else {
    const range = rangeForPeriod(period)
    from = range.from
    to = range.to
  }
  const { prevFrom, prevTo } = previousRange(from, to)
  return { period, from, to, prevFrom, prevTo }
}

function reviveAppliedFilters(value) {
  return {
    ...value,
    from: new Date(value.from),
    to: new Date(value.to),
    prevFrom: new Date(value.prevFrom),
    prevTo: new Date(value.prevTo),
  }
}

function periodLabel(applied) {
  const fmt = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${fmt.format(applied.from)} - ${fmt.format(applied.to)}`
}

export default function SalesReportPage() {
  const { pathname } = useLocation()
  const legacyAnalyticsView = pathname === '/admin/products' ? 'products' : pathname === '/admin/trends' ? 'trends' : null
  const isAnalyticsPage = pathname === '/admin/analytics' || Boolean(legacyAnalyticsView)
  const [raw, setRaw] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)
  const [toasts, setToasts] = useState([])
  const [filterError, setFilterError] = useState('')

  // Keep the visible controls separate from the last valid filter set so custom
  // date input can be edited safely while every valid change updates the report.
  const draftAtMount = useRef(hasManagementSessionState('admin:sales:draft-period'))
  const [draftPeriod, setDraftPeriod] = useManagementSessionState('admin:sales:draft-period', 'month')
  const [draftFrom, setDraftFrom] = useManagementSessionState('admin:sales:draft-from', '')
  const [draftTo, setDraftTo] = useManagementSessionState('admin:sales:draft-to', '')
  const [draftOrderType, setDraftOrderType] = useManagementSessionState('admin:sales:draft-order-type', 'all')
  const [draftPayment, setDraftPayment] = useManagementSessionState('admin:sales:draft-payment', 'all')
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)
  const [applied, setApplied] = useManagementSessionState('admin:sales:applied', () => ({ ...buildAppliedFilters('month'), orderType: 'all', paymentMethod: 'all' }), { deserialize: reviveAppliedFilters })

  const [granularity, setGranularity] = useManagementSessionState('admin:sales:granularity', 'day')
  const [productSort, setProductSort] = useManagementSessionState('admin:analytics:product-sort', 'revenue')
  const [analyticsTab, setAnalyticsTab] = useManagementSessionState('admin:analytics:tab', legacyAnalyticsView || 'products')

  const [exportMenuOpen, setExportMenuOpen] = useState(false)

  const appliedRef = useRef(applied)
  appliedRef.current = applied

  useEffect(() => {
    getCurrentPortalSession().then(({ profile: currentProfile }) => setProfile(currentProfile)).catch(() => {})
    if (!draftAtMount.current) {
      setDraftFrom(dateInputValue(applied.from))
      setDraftTo(dateInputValue(applied.to))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (legacyAnalyticsView) setAnalyticsTab(legacyAnalyticsView)
  }, [legacyAnalyticsView, setAnalyticsTab])

  const pushToast = (type, message) => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, type, message }])
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200)
  }

  const load = async (filters = appliedRef.current) => {
    setLoading(true)
    try {
      const data = await fetchSalesReportData({
        dateFrom: filters.from.toISOString(),
        dateTo: filters.to.toISOString(),
        prevFrom: filters.prevFrom.toISOString(),
        prevTo: filters.prevTo.toISOString(),
      })
      setRaw(data)
      setError('')
    } catch (cause) {
      setError(describeError(cause, 'Could not load the sales report.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(applied) }, [applied])

  useEffect(() => {
    const refresh = () => load(appliedRef.current)
    const channel = supabase
      .channel('sales-report-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refunds' }, refresh)
      .subscribe()
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { supabase.removeChannel(channel); document.removeEventListener('visibilitychange', onVisible) }
  }, [])

  const commitFilters = ({ period = draftPeriod, from = draftFrom, to = draftTo, orderType = draftOrderType, paymentMethod = draftPayment } = {}) => {
    if (period === 'custom' && (!from || !to)) {
      setFilterError('Choose both a start date and an end date for a custom report.')
      return false
    }
    if (period === 'custom' && new Date(`${from}T00:00:00`) > new Date(`${to}T23:59:59.999`)) {
      setFilterError('The start date must be on or before the end date.')
      return false
    }
    const next = { ...buildAppliedFilters(period, from, to), orderType, paymentMethod }
    setFilterError('')
    setApplied(next)
    const current = appliedRef.current
    if (current.from.getTime() !== next.from.getTime() || current.to.getTime() !== next.to.getTime()) {
      setGranularity('day')
    }
    return true
  }

  const selectPeriodPreset = (key) => {
    setDraftPeriod(key)
    if (key !== 'custom') {
      const range = rangeForPeriod(key)
      const from = dateInputValue(range.from)
      const to = dateInputValue(range.to)
      setDraftFrom(from)
      setDraftTo(to)
      commitFilters({ period: key, from, to })
      return
    }
    commitFilters({ period: key })
  }

  const handleCustomDateChange = (field, value) => {
    const from = field === 'from' ? value : draftFrom
    const to = field === 'to' ? value : draftTo
    if (field === 'from') setDraftFrom(value)
    else setDraftTo(value)
    setFilterError('')
    commitFilters({ period: 'custom', from, to })
  }

  const handleOrderTypeChange = (value) => {
    setDraftOrderType(value)
    commitFilters({ orderType: value })
  }

  const handlePaymentChange = (value) => {
    setDraftPayment(value)
    commitFilters({ paymentMethod: value })
  }

  const filteredOrders = useMemo(
    () => (raw ? applyLocalFilters(raw.orders, { orderType: applied.orderType, paymentMethod: applied.paymentMethod }) : []),
    [raw, applied.orderType, applied.paymentMethod],
  )
  const filteredPrevious = useMemo(
    () => (raw ? applyLocalFilters(raw.previousOrders, { orderType: applied.orderType, paymentMethod: applied.paymentMethod }) : []),
    [raw, applied.orderType, applied.paymentMethod],
  )

  const report = useMemo(() => computeSalesReport(filteredOrders, filteredPrevious), [filteredOrders, filteredPrevious])
  const analyticsView = isAnalyticsPage ? (analyticsTab === 'trends' ? 'trends' : 'products') : 'reports'
  const pageMeta = isAnalyticsPage
    ? { title: 'Analytics' }
    : { title: 'Sales Reports' }
  const trend = useMemo(
    () => buildTrend(filteredOrders, filteredPrevious, { dateFrom: applied.from, dateTo: applied.to, granularity }),
    [filteredOrders, filteredPrevious, applied.from, applied.to, granularity],
  )
  const dailyTrend = useMemo(() => buildTrend(filteredOrders, filteredPrevious, { dateFrom: applied.from, dateTo: applied.to, granularity: 'day' }), [filteredOrders, filteredPrevious, applied.from, applied.to])
  const productMomentum = useMemo(
    () => computeProductMomentum(filteredOrders, filteredPrevious),
    [filteredOrders, filteredPrevious],
  )
  const filterLabel = useMemo(() => {
    const parts = [periodLabel(applied)]
    if (applied.orderType !== 'all') parts.push(ORDER_TYPE_LABEL[applied.orderType])
    if (applied.paymentMethod !== 'all') parts.push(PAYMENT_LABEL[applied.paymentMethod])
    return parts.join(' / ')
  }, [applied])
  const reportRangeLabel = periodLabel(applied)

  const runExportCsv = () => {
    const exportSummary = computeSalesReport(filteredOrders, []).summary
    const csv = exportSalesReportCsv({ orders: filteredOrders, summary: exportSummary, filterLabel, generatedBy: profile?.full_name || profile?.email })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `sales-report-${dateInputValue(applied.from)}-to-${dateInputValue(applied.to)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    pushToast('success', `Exported ${filteredOrders.length} order${filteredOrders.length === 1 ? '' : 's'} to CSV.`)
    setExportMenuOpen(false)
  }

  const runExportPdf = () => {
    const ok = printSalesReportPdf({ report, trend, filterLabel, generatedBy: profile?.full_name || profile?.email })
    if (ok) pushToast('success', 'Sales report PDF is ready to print or save.')
    else pushToast('error', 'The report window was blocked by the browser.')
    setExportMenuOpen(false)
  }

  return (
    <AppShell
      role="admin"
      title={pageMeta.title}
      rangeLabel={reportRangeLabel}
      onRefresh={() => load(appliedRef.current)}
    >
      {isAnalyticsPage && <AnalyticsTabs activeKey={analyticsView} onChange={setAnalyticsTab} />}
      {loading && !raw ? <ReportSkeleton /> : error && !raw ? (
        <div className="inv-empty"><AlertTriangle size={28} /><h3>Could not load the sales report</h3><p>{error}</p><button type="button" className="ops-main-action" onClick={() => load()}>Retry</button></div>
      ) : (
        <div className="dash-fade-in" id={isAnalyticsPage ? "analytics-report-panel" : undefined} role={isAnalyticsPage ? "tabpanel" : undefined} aria-labelledby={isAnalyticsPage ? `${analyticsView}-tab` : undefined}>
          {error && <p className="form-error">{error}</p>}
          {raw?.truncated && <p className="form-error srp-data-warning" role="alert">This period exceeds 5,000 orders. Figures reflect the first 5,000. Narrow the date range for exact totals.</p>}

          <section className="ir-range-bar srp-range-bar" aria-label="Sales report filters">
            <div className="ir-range-label srp-range-label">
              <CalendarDays size={16} aria-hidden="true" />
              <span><b>Report range</b><small>{reportRangeLabel}</small></span>
            </div>
            <Segments label="Report period" options={PERIOD_OPTIONS} value={draftPeriod} onChange={selectPeriodPreset} />
            <div className="srp-range-actions">
              <div className="inv-overflow srp-export-wrap">
                <button type="button" className="ops-main-action inv-record-btn srp-export-btn" aria-expanded={exportMenuOpen} aria-controls="sales-report-export-menu" onClick={() => setExportMenuOpen((open) => !open)} disabled={loading || !raw}>
                  <Download size={16} /> Export <ChevronDown size={14} />
                </button>
                {exportMenuOpen && (
                  <div className="inv-overflow-menu txn-export-menu srp-export-menu" id="sales-report-export-menu" role="menu">
                    <button type="button" role="menuitem" onClick={runExportPdf}><Printer size={14} /> PDF, full report</button>
                    <button type="button" role="menuitem" onClick={runExportCsv}><FileText size={14} /> CSV, order data</button>
                  </div>
                )}
              </div>
              <button type="button" className="srp-more-filters" aria-expanded={moreFiltersOpen} aria-controls="sales-report-extra-filters" onClick={() => setMoreFiltersOpen((open) => !open)}>
                <SlidersHorizontal size={16} /> Filters
                {(draftOrderType !== 'all' || draftPayment !== 'all') && <span aria-label="Additional filters active">Active</span>}
              </button>
            </div>
          </section>
          {draftPeriod === 'custom' && (
            <div className="srp-custom-popout" id="sales-report-custom-range" role="group" aria-label="Custom report date range">
              <div className="srp-custom-popout-copy">
                <CalendarDays size={15} aria-hidden="true" />
                <span><b>Custom date range</b><small>Choose the start and end dates for this report.</small></span>
              </div>
              <div className="ir-custom-range srp-custom-range">
                <label>From
                  <input type="date" value={draftFrom} max={draftTo || undefined} onChange={(event) => handleCustomDateChange('from', event.target.value)} />
                </label>
                <span>to</span>
                <label>To
                  <input type="date" value={draftTo} min={draftFrom || undefined} onChange={(event) => handleCustomDateChange('to', event.target.value)} />
                </label>
              </div>
            </div>
          )}
          {moreFiltersOpen && (
            <div className="ir-filter-row srp-filter-row" id="sales-report-extra-filters" aria-label="Additional sales report filters">
              <label>Order type
                <select value={draftOrderType} onChange={(event) => handleOrderTypeChange(event.target.value)}>
                  <option value="all">All types</option>
                  {Object.entries(ORDER_TYPE_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </label>
              <label>Payment method
                <select value={draftPayment} onChange={(event) => handlePaymentChange(event.target.value)}>
                  <option value="all">All methods</option>
                  {Object.entries(PAYMENT_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </label>
            </div>
          )}
          {filterError && <p className="srp-filter-error" role="alert">{filterError}</p>}

          {analyticsView === 'products' ? <ProductOverview report={report} productSort={productSort} setProductSort={setProductSort} />
            : analyticsView === 'trends' ? <TrendsOverview report={report} dailyTrend={dailyTrend} productMomentum={productMomentum} />
              : <SalesOverview report={report} dailyTrend={dailyTrend} trend={trend} granularity={granularity} setGranularity={setGranularity} categoryAvailable={raw?.categoryDataAvailable !== false} />}

        </div>
      )}

      <div className="ops-toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div className={`ops-toast ops-toast-${toast.type}`} key={toast.id}>
            {toast.type === 'success' ? <Check size={15} /> : <AlertTriangle size={15} />} {toast.message}
          </div>
        ))}
      </div>
    </AppShell>
  )
}

function AnalyticsTabs({ activeKey, onChange }) {
  return <div className="rp-page-tabs"><div className="rp-segments" role="tablist" aria-label="Analytics views" onKeyDown={(event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 'products' : event.key === 'End' ? 'trends' : activeKey === 'products' ? 'trends' : 'products'
    onChange(next); event.currentTarget.querySelector('[data-tab="' + next + '"]')?.focus()
  }}>{ANALYTICS_TABS.map(({ key, label }) => <button key={key} id={key + '-tab'} data-tab={key} type="button" role="tab" aria-selected={activeKey === key} aria-controls="analytics-report-panel" tabIndex={activeKey === key ? 0 : -1} className={activeKey === key ? 'active' : ''} onClick={() => onChange(key)}>{label}</button>)}</div></div>
}
function ReportSkeleton() { return <div className="rp-skeleton" aria-label="Loading report" role="status"><i /><i /><i /><i /><i /></div> }
