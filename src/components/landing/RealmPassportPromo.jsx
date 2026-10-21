import { useId, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import usePassportPromoMotion from './usePassportPromoMotion'
import { PASSPORT_ASSETS } from '../../utils/realmPassport'
import './realm-passport-promo.css'

export default function RealmPassportPromo({ customerUser = false }) {
  const sectionRef = useRef(null)
  const id = useId()
  const navigate = useNavigate()
  usePassportPromoMotion(sectionRef)

  // Preserve the existing authenticated destination and post-signup return route.
  const openPassport = () => {
    if (customerUser) navigate('/realm-passport')
    else navigate('/register', { state: { from: '/realm-passport' } })
  }

  return (
    <section ref={sectionRef} className="realm-passport-promo" id="rewards" aria-labelledby={`${id}-title`}>
        {/* SVG symbols stay local; every rendered decorative SVG is aria-hidden. */}
        <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute', overflow: 'hidden' }}>
          <defs>
            <symbol id={`${id}-bean-art`} viewBox="0 0 32 44">
              <path d="M28 25C25 37 17 44 9 40S0 25 4 14 15-1 23 3s8 11 5 22Z" fill="currentColor"/>
              <path d="M19 3C9 14 24 25 10 40" fill="none" stroke="#392c1c" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9 10c-3 4-4 8-4 11" fill="none" stroke="#a36d40" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
            </symbol>
            <symbol id={`${id}-sparkle-art`} viewBox="0 0 24 24"><path d="m12 0 2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6Z" fill="currentColor"/></symbol>
            <symbol id={`${id}-check-art`} viewBox="0 0 24 24"><path d="m6 12 4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></symbol>
            <symbol id={`${id}-gift-art`} viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10v10h14V10M3 7h18v4H3zM12 7v13"/><path d="M12 7H8a2.5 2.5 0 1 1 2.5-2.5L12 7Zm0 0h4a2.5 2.5 0 1 0-2.5-2.5L12 7Z"/></g></symbol>
            <symbol id={`${id}-ink-art`} viewBox="0 0 70 70"><g fill="none" stroke="currentColor"><circle cx="35" cy="35" r="29" strokeWidth="1.5" strokeDasharray="2 3"/><circle cx="35" cy="35" r="23" strokeWidth="1"/><path d="m24 35 8 8 16-19" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/></g></symbol>
          </defs>
        </svg>

        <header className="rpp-heading">
          <p className="rpp-eyebrow">THE COFFEE REALM · MEMBER'S EDITION</p>
          <h2 id={`${id}-title`}>Every cup earns <em>its stamp.</em></h2>
        </header>

        <div className="rpp-stage">
          <div className="rpp-mail-anchor" aria-hidden="true">
            <div className="rpp-parallax" data-depth=".18">
              <div className="rpp-mail">
                <div className="rpp-envelope-shadow"></div>
                <div className="rpp-envelope-back"></div>
                <div className="rpp-envelope-flap"></div>
                <div className="rpp-passport-window">
                  <div className="rpp-book-position">
                    <div className="rpp-book-rise"><div className="rpp-book-float"><div className="rpp-book-tilt"><div className="rpp-book-feedback">
                      <div className="rpp-book">
                        <img className="rpp-book-cover" src={`${PASSPORT_ASSETS}realm-passport-cover-v3.png`} alt="" width="1024" height="1536" loading="lazy" decoding="async" draggable="false" />
                      </div>
                    </div></div></div></div>
                  </div>
                </div>
                <div className="rpp-envelope-front"></div>
                <div className="rpp-seal-position"><div className="rpp-seal"><img src="/images/coffeerealmlogo.png" alt="" width="34" height="34" /><span className="rpp-seal-shine"></span></div></div>
                <div className="rpp-note-position"><p className="rpp-note">Reserved for you.</p></div>
              </div>
            </div>
          </div>

          {/* One completed, paid order earns one stamp, regardless of its items/type.
               This is per order, never per cup or per purchased item. */}
          <div className="rpp-ticket-position rpp-ticket-left"><div className="rpp-ticket-reveal"><p className="rpp-ticket">1 completed, paid order<strong>→ 1 stamp</strong></p></div></div>
          <div className="rpp-ticket-position rpp-ticket-right"><div className="rpp-ticket-reveal"><p className="rpp-ticket">5 stamps<strong>→ a surprise reward</strong></p></div></div>

          <div className="rpp-object rpp-bean rpp-bean-one" aria-hidden="true"><div className="rpp-parallax" data-depth=".8"><div className="rpp-object-reveal"><div className="rpp-object-float"><svg aria-hidden="true"><use href={`#${id}-bean-art`}/></svg></div></div></div></div>
          <div className="rpp-object rpp-bean rpp-bean-two" aria-hidden="true"><div className="rpp-parallax" data-depth=".65"><div className="rpp-object-reveal"><div className="rpp-object-float"><svg aria-hidden="true"><use href={`#${id}-bean-art`}/></svg></div></div></div></div>
          <div className="rpp-object rpp-bean rpp-bean-three" aria-hidden="true"><div className="rpp-parallax" data-depth="1"><div className="rpp-object-reveal"><div className="rpp-object-float"><svg aria-hidden="true"><use href={`#${id}-bean-art`}/></svg></div></div></div></div>
          <div className="rpp-object rpp-bean rpp-bean-four" aria-hidden="true"><div className="rpp-parallax" data-depth=".75"><div className="rpp-object-reveal"><div className="rpp-object-float"><svg aria-hidden="true"><use href={`#${id}-bean-art`}/></svg></div></div></div></div>
          <div className="rpp-object rpp-cup" aria-hidden="true"><div className="rpp-parallax" data-depth=".5"><div className="rpp-object-reveal"><div className="rpp-object-float">
            <svg viewBox="0 0 64 72" aria-hidden="true">
              <g fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round">
                <path className="rpp-steam" d="M19 22c-7-6 5-9 0-16"/><path className="rpp-steam rpp-steam-two" d="M29 21c-7-6 5-9 0-16"/><path className="rpp-steam rpp-steam-three" d="M39 23c-7-6 5-9 0-16"/>
              </g>
              <path d="M48 31h6c10 0 8 14-6 13" fill="none" stroke="var(--cream)" strokeWidth="3"/>
              <path d="M9 30h40v11c0 12-8 19-20 19S9 53 9 41Z" fill="var(--cream)"/>
              <path d="M11 32h36" stroke="var(--paper)" strokeWidth="2"/><path d="M8 64h44" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div></div></div></div>
          <div className="rpp-object rpp-rubber-stamp" aria-hidden="true"><div className="rpp-parallax" data-depth=".9"><div className="rpp-object-reveal"><div className="rpp-stamp-press">
            <svg viewBox="0 0 62 78" aria-hidden="true"><path d="m26 24-3 28h16l-3-28Z" fill="#b38d45"/><circle cx="31" cy="17" r="11" fill="var(--gold)"/><path d="M16 49h31a4 4 0 0 1 4 4v11H12V53a4 4 0 0 1 4-4Z" fill="var(--gold)"/><path d="M10 68h43v6H10z" fill="var(--bean)"/><path d="M16 51h30" stroke="var(--gold-light)" strokeLinecap="round"/></svg>
          </div></div></div></div>
          <div className="rpp-object rpp-ink" aria-hidden="true"><div className="rpp-parallax" data-depth=".3"><div className="rpp-object-reveal"><svg className="rpp-ink-static" aria-hidden="true"><use href={`#${id}-ink-art`}/></svg><svg className="rpp-ink-pulse" aria-hidden="true"><use href={`#${id}-ink-art`}/></svg></div></div></div>
          <div className="rpp-object rpp-sparkle rpp-sparkle-one" aria-hidden="true"><div className="rpp-parallax" data-depth=".4"><div className="rpp-object-reveal"><svg className="rpp-twinkle" aria-hidden="true"><use href={`#${id}-sparkle-art`}/></svg></div></div></div>
          <div className="rpp-object rpp-sparkle rpp-sparkle-two" aria-hidden="true"><div className="rpp-parallax" data-depth=".6"><div className="rpp-object-reveal"><svg className="rpp-twinkle" aria-hidden="true"><use href={`#${id}-sparkle-art`}/></svg></div></div></div>
          <div className="rpp-object rpp-sparkle rpp-sparkle-three" aria-hidden="true"><div className="rpp-parallax" data-depth=".5"><div className="rpp-object-reveal"><svg className="rpp-twinkle" aria-hidden="true"><use href={`#${id}-sparkle-art`}/></svg></div></div></div>
        </div>

        <div className="rpp-footer">
          {/* A preview of the five-stamp journey, never an account balance.
               Actual earned stamps remain on the authenticated passport page. */}
          <ol className="rpp-progress" aria-label="Passport stamp progress" aria-describedby={`${id}-caption`}>
            <li className="rpp-collected" aria-label="Stamp 1: collected"><svg aria-hidden="true"><use href={`#${id}-check-art`}/></svg></li>
            <li className="rpp-empty" style={{ '--pulse-delay': '850ms' }} aria-label="Stamp 2: not yet collected"></li>
            <li className="rpp-empty" style={{ '--pulse-delay': '1120ms' }} aria-label="Stamp 3: not yet collected"></li>
            <li className="rpp-empty" style={{ '--pulse-delay': '1390ms' }} aria-label="Stamp 4: not yet collected"></li>
            <li className="rpp-gift" aria-label="Stamp 5: surprise reward"><svg aria-hidden="true"><use href={`#${id}-gift-art`}/></svg></li>
          </ol>
          <p className="rpp-caption" id={`${id}-caption`}>1 stamp collected · 4 to your surprise</p>
          <button className="rpp-claim" type="button" onClick={openPassport}><span>{customerUser ? 'Open my passport' : 'Claim your passport'}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        </div>
      </section>
  )
}
