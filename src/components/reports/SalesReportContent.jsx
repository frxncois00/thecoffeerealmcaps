import { useState } from 'react'
import { Card, DataTable, Insights, Metric, RankedBars, Segments } from './ReportUI'
import { money } from '../../utils/money'
import { ORDER_TYPE_LABEL, PAYMENT_LABEL } from '../../services/salesReportService'

const number = (value) => Number(value || 0).toLocaleString('en-PH')
const delta = (current, previous) => previous > 0 ? `${current >= previous ? '↑' : '↓'} ${Math.abs((current - previous) / previous * 100).toFixed(1)}% vs previous period` : 'No previous-period data'

function DailyBars({ points, grouping }) {
  const maximum = Math.max(1, ...points.map((point) => point.revenue))
  const best = points.find((point) => point.revenue === maximum)
  return <div className="rp-chart-scroll" tabIndex={0} role="region" aria-label="Sales bars, scroll horizontally for all periods"><div className="rp-daily-bars" style={{ minWidth: `${Math.max(360, points.length * 112)}px` }}>
    {points.map((point) => <div className={`rp-day${point === best ? ' best' : ''}${point.revenue === 0 ? ' zero' : ''}`} key={point.key} role="img" aria-label={`${point.label}: ${money(point.revenue)}, ${point.orders} orders`}>
      <div className="rp-bar-area"><div className="rp-day-bar" style={{ height: `${point.revenue / maximum * 100}%` }}><span>{point.revenue ? money(point.revenue) : 'No sales'}{point === best && <em>BEST</em>}</span></div></div>
      <b>{point.label}</b><small>{grouping === 'day' && `${new Intl.DateTimeFormat('en-PH', { weekday: 'short' }).format(new Date(`${point.key}T12:00:00`))} · `}{number(point.orders)} orders</small>
    </div>)}
  </div></div>
}

function ProductTable({ products, title = 'Product Momentum' }) {
  const sorted = [...products].sort((a, b) => b.revenue - a.revenue)
  return <DataTable title={title} subtitle="Line-item revenue from completed paid orders" showSearch={false} rows={sorted} columns={[
    { key: 'name', label: 'Item', render: (row) => <><b>{row.name}</b><small>{row.category}</small></> },
    { key: 'qty', label: 'Qty', numeric: true, render: (row) => number(row.qty) },
    { key: 'revenue', label: 'Revenue', numeric: true, render: (row) => money(row.revenue) },
    { key: 'share', label: 'Share of product sales', numeric: true, render: (row) => <div className="rp-share"><div className="rp-track"><i style={{ width: `${Math.min(100, row.pct)}%` }} /></div>{row.pct.toFixed(1)}%</div> },
  ]} />
}

function RevenueSources({ report, categoryAvailable }) {
  const [source, setSource] = useState('payment')
  const [timing, setTiming] = useState('hour')
  const entries = source === 'payment' ? Object.entries(report.paymentTotals).map(([key, value]) => ({ label: PAYMENT_LABEL[key] || key, value, display: money(value), detail: `${(report.summary.netRevenue ? value / report.summary.netRevenue * 100 : 0).toFixed(1)}%` }))
    : source === 'category' ? report.categoryTotals.map((entry) => ({ label: entry.category, value: entry.revenue, display: money(entry.revenue), detail: `${(report.productRevenue ? entry.revenue / report.productRevenue * 100 : 0).toFixed(1)}%` }))
      : Object.entries(report.orderChannelCounts).map(([key, value]) => ({ label: ORDER_TYPE_LABEL[key] || key, value, display: `${number(value)} orders`, detail: `${(report.summary.totalOrders ? value / report.summary.totalOrders * 100 : 0).toFixed(1)}%` }))
  const times = timing === 'hour' ? report.hourlySales.filter((entry) => entry.orders > 0) : report.weekdaySales
  return <div className="rp-two-col"><Card title="Where sales come from" subtitle={source === 'payment' ? 'Net revenue share' : source === 'category' ? (categoryAvailable ? 'Line-item revenue share · before order adjustments' : 'Category data unavailable') : 'Completed paid orders by channel'} actions={<Segments label="Sales source" value={source} onChange={setSource} options={[[ 'payment', 'Payment' ], [ 'category', 'Category' ], [ 'channel', 'Channel' ]]} />}><RankedBars entries={entries} /></Card>
    <Card title="When customers buy" subtitle="Paid orders and net revenue" actions={<Segments label="Buying pattern" value={timing} onChange={setTiming} options={[[ 'hour', 'Time of day' ], [ 'weekday', 'Day of week' ]]} />} className="rp-buying-card"><div className="rp-buying-scroll" role="region" aria-label="When customers buy, scroll to see more periods" tabIndex={0}><RankedBars entries={times.map((entry) => ({ label: entry.label, value: entry.revenue, display: money(entry.revenue), detail: `${number(entry.orders)} orders` }))} /></div></Card></div>
}

export function SalesOverview({ report, dailyTrend, trend, granularity, setGranularity, categoryAvailable }) {
  const s = report.summary, p = report.previousSummary
  const best = [...dailyTrend].sort((a, b) => b.revenue - a.revenue)[0]
  const zero = dailyTrend.filter((day) => day.orders === 0)
  const leader = report.topProducts[0]
  return <>
    <Insights items={[
      s.cancellationRate > 10 && { tone: 'warning', title: `Cancellation rate is ${s.cancellationRate.toFixed(1)}%`, detail: `${s.cancelledOrders} of ${s.totalOrdersInRange} orders were cancelled. Review reasons.` },
      zero.length > 0 && { tone: 'warning', title: zero.length === 1 ? `No sales on ${zero[0].label}` : `${zero.length} days with no sales`, detail: 'Check if the store was closed or the POS was offline.' },
      leader?.pct > 25 && { title: `One item drives ${leader.pct.toFixed(1)}% of product revenue`, detail: `${leader.name}: ${number(leader.qty)} units · ${money(leader.revenue)}.` },
    ]} />
    <section className="rp-kpis" aria-label="Sales overview"><Metric hero label="Net revenue" value={money(s.netRevenue)} detail={delta(s.netRevenue, p.netRevenue)} /><Metric label="Completed paid orders" value={number(s.totalOrders)} detail={delta(s.totalOrders, p.totalOrders)} /><Metric label="Average order value" value={money(s.averageOrderValue)} detail={delta(s.averageOrderValue, p.averageOrderValue)} /><Metric label="Items sold" value={number(s.totalItems)} detail={delta(s.totalItems, p.totalItems)} /></section>
    <div className="rp-sales-row"><Card title="Sales trend" subtitle="Net revenue by period · values shown directly" actions={<Segments label="Sales trend grouping" value={granularity} onChange={setGranularity} options={[[ 'day', 'Day' ], [ 'week', 'Week' ], [ 'month', 'Month' ]]} />}>
      <div className="rp-mini-stats"><div><span>Total</span><b>{money(s.netRevenue)}</b></div><div><span>Best day</span><b>{best?.revenue > 0 ? `${best.label} · ${money(best.revenue)}` : 'No sales'}</b></div><div><span>Daily average</span><b>{money(s.netRevenue / Math.max(1, dailyTrend.length))}</b></div><div><span>Zero-sales days</span><b className="rp-warning-text">{zero.length}</b></div></div><DailyBars points={trend} grouping={granularity} />
    </Card><Card title="Revenue breakdown" subtitle="Existing gross and net revenue totals"><dl className="rp-receipt"><div><dt>Gross sales</dt><dd>{money(s.grossSales)}</dd></div><div><dt>Discounts</dt><dd className="rp-danger-text">− {money(s.discounts)}</dd></div><div><dt>Refunds</dt><dd>− {money(s.refunds)}</dd></div><div className="total"><dt>Net revenue</dt><dd>{money(s.netRevenue)}</dd></div></dl><p className="rp-note">Delivery fees of {money(s.deliveryFees)} are excluded.</p><div className="rp-mini-stats rates"><div><span>Refund rate</span><b>{s.refundRate.toFixed(1)}%</b><small>{s.refundedOrders} of {s.totalOrdersInRange} orders</small></div><div><span>Cancellation rate</span><b className={s.cancellationRate > 10 ? 'rp-warning-text' : ''}>{s.cancellationRate.toFixed(1)}%</b><small>{s.cancelledOrders} of {s.totalOrdersInRange} orders</small></div></div></Card></div>
    <RevenueSources report={report} categoryAvailable={categoryAvailable} /><ProductTable products={report.products} />
  </>
}

export function ProductOverview({ report, productSort, setProductSort }) {
  const leader = report.topProducts[0]
  const slow = [...report.products].sort((a, b) => a.qty - b.qty || a.revenue - b.revenue).slice(0, 5)
  const best = [...report.products].sort((a, b) => productSort === 'qty' ? b.qty - a.qty : b.revenue - a.revenue).slice(0, 5)
  const bars = (products) => products.map((item) => ({ label: item.name, value: productSort === 'qty' ? item.qty : item.revenue, display: money(item.revenue), detail: `${number(item.qty)} units · ${item.pct.toFixed(1)}%` }))
  return <><Insights items={[leader && slow.some((item) => item.id === leader.id) && { title: 'Units alone can mislead', detail: `${leader.name} leads revenue and also appears among the least-ordered items.` }]} />
    <section className="rp-kpis" aria-label="Product performance overview"><Metric hero label="Product revenue" value={money(report.productRevenue)} detail="Line revenue from completed sales" /><Metric label="Units sold" value={number(report.summary.totalItems)} detail={delta(report.summary.totalItems, report.previousSummary.totalItems)} /><Metric label="Distinct products" value={number(report.productCount)} detail="With completed sales" /><Metric label="Top product share" value={leader ? `${leader.pct.toFixed(1)}%` : '0%'} detail={leader?.name || 'No products in this period'} /></section>
    <div className="rp-two-col"><Card title="Best sellers" subtitle="Top five products" actions={<Segments label="Rank products by" value={productSort} onChange={setProductSort} options={[[ 'revenue', 'Revenue' ], [ 'qty', 'Units' ]]} />}><RankedBars entries={bars(best)} /></Card><Card title="Slow movers" subtitle="Five items with the fewest units sold"><RankedBars entries={bars(slow)} /></Card></div><ProductTable products={report.products} title="Product Momentum" /></>
}

export function TrendsOverview({ report, dailyTrend, productMomentum }) {
  const active = dailyTrend.filter((point) => point.orders > 0)
  const ordered = [...active].sort((a, b) => b.revenue - a.revenue)
  const best = ordered[0], slow = ordered.at(-1)
  const prior = report.previousSummary.netRevenue > 0 || report.previousSummary.totalOrders > 0
  const channel = Object.entries(report.orderChannelCounts).sort((a, b) => b[1] - a[1])[0]
  const averagePerDay = report.summary.netRevenue / Math.max(1, dailyTrend.length)
  return <><Insights items={[
    !prior && { title: '+100% is not a real trend yet', detail: 'There are no completed paid orders in the previous period. Build a baseline before comparing growth.' },
    channel?.[1] > 0 && { title: `${ORDER_TYPE_LABEL[channel[0]]} is the leading channel`, detail: `${number(channel[1])} completed paid orders in this period.` },
    best && { title: `${best.label} was the best day`, detail: `${money(best.revenue)} from ${number(best.orders)} completed paid orders.` },
    ]} /><section className="rp-kpis" aria-label="Sales trends overview"><Metric hero label="Revenue growth" value={prior ? `${report.comparison.revenuePct >= 0 ? '+' : ''}${report.comparison.revenuePct.toFixed(1)}%` : 'No prior data'} detail={prior ? `Compared with ${money(report.previousSummary.netRevenue)} previous-period revenue` : 'A comparison baseline is needed'} /><Metric label="Peak day" value={best?.label || 'No sales'} detail={best ? `${money(best.revenue)} · ${number(best.orders)} orders` : 'No recorded sales'} /><Metric label="Slowest active day" value={slow?.label || 'No sales'} detail={slow ? `${money(slow.revenue)} · ${number(slow.orders)} orders` : 'No recorded sales'} /><Metric label="Average per day" value={money(averagePerDay)} detail={`${active.length} active days · ${dailyTrend.length} calendar days`} /></section>
    <DataTable title="Product momentum" subtitle="Revenue and units compared with the previous period" rows={productMomentum} columns={[
      { key: 'name', label: 'Product', render: (row) => <><b>{row.name}</b><small>{row.category}</small></> },
      { key: 'revenue', label: 'Revenue', numeric: true, render: (row) => money(row.revenue) },
      { key: 'change', label: 'Change', render: (row) => !prior || row.previousRevenue <= 0 ? <span className="rp-pill info">No prior data</span> : <><span className={`rp-pill ${row.direction === 'up' ? 'growing' : row.direction === 'down' ? 'danger' : ''}`}>{row.direction === 'up' ? '↑ Growing' : row.direction === 'down' ? '↓ Declining' : '→ Stable'}</span><small>{row.changePct > 0 ? '+' : ''}{row.changePct.toFixed(1)}%</small></> },
      { key: 'units', label: 'Units change', numeric: true, render: (row) => `${row.unitsDelta > 0 ? '+' : ''}${number(row.unitsDelta)}` },
    ]} showSearch={false} /></>
}
