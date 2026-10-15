import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabase'
import { buildPassportPresentation } from '../../utils/realmPassportPresentation'
import { createCashierPassportApi } from '../../services/cashierPassportApi'
import './passport-checkout.css'

const passportApi = createCashierPassportApi(supabase)

function trapFocus(event, container) {
  if (event.key !== 'Tab' || !container) return
  const buttons = [...container.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled)')]
  const first = buttons[0]
  const last = buttons.at(-1)
  if (!first) { event.preventDefault(); container.focus(); return }
  if (!container.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) {
    event.preventDefault(); (event.shiftKey ? last : first).focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first.focus()
  }
}

export default function PassportCheckoutLookup({ saving, onMatch, setDiscount }) {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState('')
  const [member, setMember] = useState(null)
  const [open, setOpen] = useState(false)
  const [confirmReward, setConfirmReward] = useState(null)
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState('')
  const [refreshAttempt, setRefreshAttempt] = useState(0)
  const [claimNotice, setClaimNotice] = useState('')
  const claimInFlight = useRef(false)
  const version = useRef(0)
  const callbacks = useRef({ onMatch, setDiscount })
  callbacks.current = { onMatch, setDiscount, saving }
  const checkButton = useRef(null)
  const closeButton = useRef(null)
  const cardRef = useRef(null)
  const confirmRef = useRef(null)
  const cancelClaimButton = useRef(null)

  useEffect(() => () => { version.current++ }, [])

  useEffect(() => {
    let cancelled = false
    const request = ++version.current
    if (!value.trim()) return
    const timer = setTimeout(async () => {
      try {
        const data = await passportApi.lookup(value)
        if (cancelled || request !== version.current || callbacks.current.saving) return
        setMember(data)
        callbacks.current.onMatch(data)
        setStatus(data ? 'found' : 'missing')
        if (data?.benefit?.status === 'approved') {
          callbacks.current.setDiscount(current => ({
            ...current, enabled: true, type: data.benefit.kind === 'senior' ? 'Senior' : 'PWD',
            customerName: data.benefit.full_name || data.profile.full_name || '',
            idNumber: data.benefit.id_number, passportSource: data.id,
          }))
        }
      } catch {
        if (!cancelled && request === version.current) setStatus('error')
      }
    }, 450)
    return () => { clearTimeout(timer); cancelled = true }
  }, [value])

  useEffect(() => {
    if (!open || confirmReward) return
    let cancelled = false
    let fetching = false
    const refresh = async () => {
      if (fetching || claimInFlight.current || callbacks.current.saving) return
      fetching = true
      const request = ++version.current
      setRefreshing(true)
      try {
        const data = await passportApi.lookup(value)
        if (cancelled || request !== version.current) return
        if (!data) throw new Error('Passport no longer available. Check the ID again.')
        setMember(data)
        callbacks.current.onMatch(data)
        setRefreshError('')
      } catch (error) {
        if (!cancelled && request === version.current) setRefreshError(error.message || 'Could not refresh rewards. Please try again.')
      } finally {
        fetching = false
        if (!cancelled && request === version.current) setRefreshing(false)
      }
    }
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') refresh() }
    refresh()
    const timer = window.setInterval(refreshWhenVisible, 15000)
    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [open, value, confirmReward, refreshAttempt])

  useEffect(() => {
    if (!open) return
    closeButton.current?.focus()
    const onKey = event => {
      if (confirmReward) return
      if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); checkButton.current?.focus() }
      trapFocus(event, cardRef.current)
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, confirmReward])

  useEffect(() => {
    if (!confirmReward) return
    cancelClaimButton.current?.focus()
    const onKey = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        if (!claimInFlight.current) setConfirmReward(null)
      }
      trapFocus(event, confirmRef.current)
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [confirmReward, claiming])

  async function claimReward() {
    if (!confirmReward || claimInFlight.current || saving || !member || refreshing || refreshError) return
    claimInFlight.current = true
    const request = ++version.current
    setClaiming(true)
    setClaimError('')
    try {
      const result = await passportApi.claim(member, confirmReward.number)
      if (request !== version.current) return
      setMember(result.member)
      callbacks.current.onMatch(result.member)
      setRefreshError(result.refreshError)
      setClaimNotice(`${confirmReward.title} is marked as claimed.`)
      setConfirmReward(null)
    } catch (error) {
      if (request === version.current) setClaimError(error.message || 'Could not claim this reward. Try again.')
    } finally {
      claimInFlight.current = false
      if (request === version.current) setClaiming(false)
    }
  }

  function changeValue(event) {
    version.current++
    setValue(event.target.value)
    setStatus(event.target.value.trim() ? 'searching' : '')
    setMember(null)
    setOpen(false)
    setConfirmReward(null)
    setClaimError('')
    setClaimNotice('')
    setRefreshError('')
    setRefreshing(false)
    onMatch(null)
    setDiscount(current => current.passportSource
      ? { enabled: false, type: '', customerName: '', idNumber: '', discountedLineKeys: [] }
      : current)
  }

  const presentation = member ? buildPassportPresentation(member) : null
  const claimedNumbers = new Set((member?.claims || []).map(claim => Number(claim.reward_number)))
  const eligibleNumbers = new Set((member?.eligible_rewards || []).map(Number))
  const rewards = presentation?.chapters.filter(chapter => eligibleNumbers.has(chapter.number) || claimedNumbers.has(chapter.number)) || []
  return <>
    <div className="passport-lookup">
      <label htmlFor="checkout-passport">Realm Passport ID</label>
      <div className="passport-lookup-controls">
        <input id="checkout-passport" placeholder="TCR-0000" autoComplete="off" maxLength={8} value={value} onChange={changeValue} disabled={saving || claiming} aria-describedby="passport-lookup-status" />
        <button ref={checkButton} type="button" disabled={!member || saving || claiming} onClick={() => { setRefreshing(true); setOpen(true) }}>Check</button>
      </div>
      <small id="passport-lookup-status" className={`passport-status ${status}`} role="status">
        {status === 'searching' ? <i>Searching...</i> : status === 'found' ? member.profile.username : status === 'missing' ? 'No user found' : status === 'error' ? 'Lookup unavailable. Try again.' : '\u00a0'}
      </small>
    </div>
    {open && member && createPortal(<div className="passport-card-backdrop">
      <section ref={cardRef} className="passport-card" role="dialog" aria-modal="true" aria-labelledby="passport-card-title" inert={confirmReward ? true : undefined} tabIndex={-1}>
        <header><h2 id="passport-card-title">Realm Passport</h2><button ref={closeButton} type="button" disabled={claiming} aria-label="Close passport details" onClick={() => { setOpen(false); checkButton.current?.focus() }}>×</button></header>
        <dl>
          <div><dt>Full name</dt><dd>{member.profile.full_name || 'Not set'}</dd></div>
          <div><dt>Username</dt><dd>{presentation.identity.username}</dd></div>
          <div><dt>ID</dt><dd>{member.id}</dd></div>
          <div><dt>Birthdate</dt><dd>{presentation.identity.birthDate}</dd></div>
          <div><dt>Favorite drink</dt><dd>{presentation.identity.favoriteDrink}</dd></div>
          <div><dt>Favorite food</dt><dd>{presentation.identity.favoriteFood}</dd></div>
          <div><dt>Senior / PWD</dt><dd>{presentation.identity.verification?.label || 'Not verified'}</dd></div>
          <div><dt>Total purchases</dt><dd>{presentation.summary.totalPurchases}</dd></div>
          <div><dt>Rewards earned</dt><dd>{presentation.summary.rewardsEarned}</dd></div>
        </dl>
        <h3>Rewards</h3>
        {refreshing && <p role="status">Refreshing rewards…</p>}
        {refreshError && <p className="passport-claim-error" role="alert">{refreshError} <button type="button" disabled={refreshing || claiming} onClick={() => setRefreshAttempt(attempt => attempt + 1)}>Refresh</button></p>}
        {claimNotice && <p className="passport-claim-notice" role="status">{claimNotice}</p>}
        {rewards.length ? <ul className="passport-reward-list">{rewards.map(reward => {
          const claimed = claimedNumbers.has(reward.number)
          return <li key={reward.number}><span>{reward.title}</span><button type="button" className={claimed ? 'is-claimed' : undefined} disabled={claimed || saving || claiming || refreshing || Boolean(refreshError)} onClick={() => { setClaimError(''); setConfirmReward(reward) }}>{claimed ? 'Claimed' : 'Claim'}</button></li>
        })}</ul> : <p className="passport-empty">No rewards available yet.</p>}
        <h3>Next reward</h3>
        <p>{presentation.summary.nextReward ? `${presentation.summary.nextReward.title} · ${presentation.summary.remaining} more completed purchases` : 'All rewards earned'}</p>
      </section>
    </div>, document.body)}
    {open && confirmReward && createPortal(<div className="passport-confirm-backdrop">
      <section ref={confirmRef} className="passport-confirm" role="alertdialog" aria-modal="true" aria-labelledby="passport-confirm-title" aria-describedby="passport-confirm-description" tabIndex={-1}>
        <h2 id="passport-confirm-title">Claim this reward?</h2>
        <p id="passport-confirm-description">Confirm that you’re giving <strong>{confirmReward.title}</strong> to {member?.profile.full_name || member?.profile.username}. This can only be claimed once.</p>
        {claimError && <p className="passport-claim-error" role="alert">{claimError}</p>}
        <div className="passport-confirm-actions"><button ref={cancelClaimButton} type="button" disabled={claiming} onClick={() => setConfirmReward(null)}>Cancel</button><button type="button" disabled={claiming || saving} onClick={claimReward}>{claiming ? 'Claiming...' : 'Confirm claim'}</button></div>
      </section>
    </div>, document.body)}
  </>
}
