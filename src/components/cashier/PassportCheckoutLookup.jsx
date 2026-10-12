import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabase'
import { buildPassportPresentation } from '../../utils/realmPassportPresentation'
import './passport-checkout.css'

export default function PassportCheckoutLookup({ saving, onMatch, setDiscount }) {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState('')
  const [member, setMember] = useState(null)
  const [open, setOpen] = useState(false)
  const [confirmReward, setConfirmReward] = useState(null)
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState('')
  const version = useRef(0)
  const callbacks = useRef({ onMatch, setDiscount })
  callbacks.current = { onMatch, setDiscount, saving }
  const checkButton = useRef(null)
  const closeButton = useRef(null)
  const claimButton = useRef(null)
  const confirmButton = useRef(null)
  const cancelClaimButton = useRef(null)

  useEffect(() => {
    let cancelled = false
    const request = ++version.current
    if (!value.trim()) return
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('lookup_realm_passport', { p_realm_id: value.trim().toUpperCase() })
        if (cancelled || request !== version.current || callbacks.current.saving) return
        if (error) throw error
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
    if (!open) return
    closeButton.current?.focus()
    const onKey = event => {
      if (confirmReward) return
      if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); checkButton.current?.focus() }
      if (event.key === 'Tab') { event.preventDefault(); closeButton.current?.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, confirmReward])

  useEffect(() => {
    if (!confirmReward) return
    confirmButton.current?.focus()
    const onKey = event => {
      if (event.key === 'Escape' && !claiming) {
        event.stopPropagation()
        setConfirmReward(null)
        claimButton.current?.focus()
      }
      if (event.key === 'Tab' && event.shiftKey && document.activeElement === cancelClaimButton.current) {
        event.preventDefault(); confirmButton.current?.focus()
      } else if (event.key === 'Tab' && !event.shiftKey && document.activeElement === confirmButton.current) {
        event.preventDefault(); cancelClaimButton.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [confirmReward, claiming])

  async function claimReward() {
    if (!confirmReward || claiming || !member) return
    setClaiming(true)
    setClaimError('')
    try {
      const { data, error } = await supabase.rpc('claim_realm_passport_reward', {
        p_realm_id: member.id,
        p_reward_number: confirmReward.number,
      })
      if (error) throw error
      setMember(current => current && current.id === member.id
        ? { ...current, claims: [...(current.claims || []), data] }
        : current)
      setConfirmReward(null)
      claimButton.current?.focus()
    } catch (error) {
      setClaimError(error.message || 'Could not claim this reward. Try again.')
    } finally {
      setClaiming(false)
    }
  }

  function changeValue(event) {
    version.current++
    setValue(event.target.value)
    setStatus(event.target.value.trim() ? 'searching' : '')
    setMember(null)
    setConfirmReward(null)
    setClaimError('')
    onMatch(null)
    setDiscount(current => current.passportSource
      ? { enabled: false, type: '', customerName: '', idNumber: '', discountedLineKeys: [] }
      : current)
  }

  const presentation = member ? buildPassportPresentation(member) : null
  const claimedNumbers = new Set((member?.claims || []).map(claim => Number(claim.reward_number)))
  const claimable = presentation?.chapters.filter(chapter => chapter.status === 'unlocked' && !claimedNumbers.has(chapter.number)) || []
  return <>
    <div className="passport-lookup">
      <label htmlFor="checkout-passport">Realm Passport ID</label>
      <div className="passport-lookup-controls">
        <input id="checkout-passport" placeholder="TCR-0000" autoComplete="off" maxLength={8} value={value} onChange={changeValue} disabled={saving} aria-describedby="passport-lookup-status" />
        <button ref={checkButton} type="button" disabled={!member || saving} onClick={() => setOpen(true)}>Check</button>
      </div>
      <small id="passport-lookup-status" className={`passport-status ${status}`} role="status">
        {status === 'searching' ? <i>Searching...</i> : status === 'found' ? member.profile.username : status === 'missing' ? 'No user found' : status === 'error' ? 'Lookup unavailable. Try again.' : '\u00a0'}
      </small>
    </div>
    {open && member && createPortal(<div className="passport-card-backdrop">
      <section className="passport-card" role="dialog" aria-modal="true" aria-labelledby="passport-card-title">
        <header><h2 id="passport-card-title">Realm Passport</h2><button ref={closeButton} type="button" aria-label="Close passport details" onClick={() => { setOpen(false); checkButton.current?.focus() }}>×</button></header>
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
        <h3>What can be claimed</h3>
        {claimable.length ? <ul className="passport-reward-list">{claimable.map(reward => <li key={reward.number}><span>{reward.title}</span><button ref={claimButton} type="button" disabled={saving || claiming} onClick={() => { setClaimError(''); setConfirmReward(reward) }}>Claim</button></li>)}</ul> : <p className="passport-empty">Empty</p>}
        {(member.claims || []).length ? <><h3>Claimed rewards</h3><ul className="passport-claimed-list">{(member.claims || []).map(claim => <li key={claim.reward_number}>{presentation.chapters[claim.reward_number - 1]?.title || `Reward ${claim.reward_number}`} · Claimed</li>)}</ul></> : null}
        <h3>Next reward</h3>
        <p>{presentation.summary.nextReward ? `${presentation.summary.nextReward.title} · ${presentation.summary.remaining} more completed purchases` : 'All rewards earned'}</p>
      </section>
    </div>, document.body)}
    {open && confirmReward && createPortal(<div className="passport-confirm-backdrop">
      <section className="passport-confirm" role="alertdialog" aria-modal="true" aria-labelledby="passport-confirm-title" aria-describedby="passport-confirm-description">
        <h2 id="passport-confirm-title">Claim this reward?</h2>
        <p id="passport-confirm-description">Confirm that you’re giving <strong>{confirmReward.title}</strong> to {member?.profile.full_name || member?.profile.username}. This can only be claimed once.</p>
        {claimError && <p className="passport-claim-error" role="alert">{claimError}</p>}
        <div className="passport-confirm-actions"><button ref={cancelClaimButton} type="button" disabled={claiming} onClick={() => setConfirmReward(null)}>Cancel</button><button ref={confirmButton} type="button" disabled={claiming} onClick={claimReward}>{claiming ? 'Claiming...' : 'Confirm claim'}</button></div>
      </section>
    </div>, document.body)}
  </>
}
