import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const pad = value => String(value).padStart(2, '0')
const toValue = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const fromValue = value => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}
const displayDate = value => {
  const date = fromValue(value)
  return date ? `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}` : ''
}

export default function BirthDatePicker({ value, onChange, min = '1900-01-01', max }) {
  const id = useId()
  const root = useRef(null)
  const today = useMemo(() => fromValue(max) || new Date(), [max])
  const selected = useMemo(() => fromValue(value), [value])
  const initial = selected || new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1))
  const minDate = useMemo(() => fromValue(min), [min])
  const maxDate = useMemo(() => fromValue(max) || today, [max, today])
  const years = useMemo(() => Array.from({ length: maxDate.getFullYear() - minDate.getFullYear() + 1 }, (_, index) => maxDate.getFullYear() - index), [maxDate, minDate])

  useEffect(() => {
    if (!open) return undefined
    const dismiss = event => { if (!root.current?.contains(event.target)) setOpen(false) }
    const escape = event => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  const firstDay = new Date(view.getFullYear(), view.getMonth(), 1).getDay()
  const dayCount = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1
    return day > 0 && day <= dayCount ? new Date(view.getFullYear(), view.getMonth(), day) : null
  })
  const shiftMonth = amount => setView(current => new Date(current.getFullYear(), current.getMonth() + amount, 1))
  const canGoBack = new Date(view.getFullYear(), view.getMonth(), 1) > new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  const canGoForward = new Date(view.getFullYear(), view.getMonth() + 1, 1) <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)

  return <div className="onboarding-field birthdate-field" ref={root}>
    <label htmlFor={id}>Birthdate</label>
    <button id={id} className="birthdate-trigger" type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(current => !current)}>
      <CalendarDays size={19}/><span className={value ? '' : 'is-placeholder'}>{displayDate(value) || 'Choose your birthdate'}</span><span className="birthdate-trigger-caret">▾</span>
    </button>
    <small>We use this to personalize your Coffee Realm experience.</small>
    {open ? <div className="birthdate-calendar" role="dialog" aria-label="Choose your birthdate">
      <div className="birthdate-calendar-heading"><div><span>Select your</span><strong>Birthdate</strong></div><CalendarDays size={24}/></div>
      <div className="birthdate-calendar-nav">
        <button type="button" aria-label="Previous month" disabled={!canGoBack} onClick={() => shiftMonth(-1)}><ChevronLeft size={18}/></button>
        <select aria-label="Month" value={view.getMonth()} onChange={event => setView(new Date(view.getFullYear(), Number(event.target.value), 1))}>{MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}</select>
        <select aria-label="Year" value={view.getFullYear()} onChange={event => setView(new Date(Number(event.target.value), view.getMonth(), 1))}>{years.map(year => <option key={year}>{year}</option>)}</select>
        <button type="button" aria-label="Next month" disabled={!canGoForward} onClick={() => shiftMonth(1)}><ChevronRight size={18}/></button>
      </div>
      <div className="birthdate-weekdays" aria-hidden="true">{WEEKDAYS.map(day => <span key={day}>{day}</span>)}</div>
      <div className="birthdate-days">{cells.map((date, index) => {
        if (!date) return <span key={`blank-${index}`}/>
        const dateValue = toValue(date)
        const disabled = date < minDate || date > maxDate
        return <button key={dateValue} type="button" disabled={disabled} className={dateValue === value ? 'is-selected' : ''} aria-label={`${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`} aria-pressed={dateValue === value} onClick={() => { onChange(dateValue); setOpen(false) }}>{date.getDate()}</button>
      })}</div>
      <div className="birthdate-calendar-footer"><button type="button" onClick={() => onChange('')}>Clear</button><span>{displayDate(value) || 'No date selected'}</span></div>
    </div> : null}
  </div>
}
