import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { useRealmMotion } from '../../motion/useRealmMotion'
import { motionTokens } from '../../motion/config'
import './realm-passport-promo.css'

export default function RealmPassportPromo({ customerUser = false }) {
  const compositionRef = useRef(null)
  const revealed = useInView(compositionRef, { once: true, amount: 0.35 })
  const { enabled, ambient } = useRealmMotion()

  return (
    <section className="realm-passport-promo" id="rewards" aria-label="Realm Passport rewards">
      <div className="realm-passport-promo-inner">
        <div className="realm-passport-promo-layout">
          <div ref={compositionRef} className="realm-passport-post" data-hover-motion={ambient ? 'true' : 'false'}>
            <div className="realm-passport-envelope-back" aria-hidden="true" />
            <motion.div
              className="realm-passport-cover-reveal"
              initial={false}
              animate={{ y: enabled && !revealed ? 18 : 0 }}
              transition={{ duration: enabled ? 0.85 : 0, ease: motionTokens.ease }}
            >
              <div className="realm-passport-cover-lift">
                {/* Only the existing closed cover belongs in this public preview. */}
                <img
                  src="/images/realm-passport/realm-passport-cover-v3.png"
                  alt="Closed Realm Passport tucked into a forest-green envelope"
                  width="1024"
                  height="1536"
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                />
              </div>
            </motion.div>
            <div className="realm-passport-envelope-front" aria-hidden="true">
              <span className="realm-passport-envelope-fold realm-passport-envelope-fold-left" />
              <span className="realm-passport-envelope-fold realm-passport-envelope-fold-right" />
              <span className="realm-passport-envelope-fold realm-passport-envelope-fold-bottom" />
            </div>
            <span className="realm-passport-paper-tab">Reserved for you.</span>
            <span className="realm-passport-envelope-seal" aria-hidden="true">
              <img src="/images/coffeerealmlogo.png" alt="" width="500" height="500" loading="lazy" decoding="async" />
            </span>
          </div>

          <p className="realm-passport-slip realm-passport-slip-order">1 completed, paid order <span>→ 1 stamp</span></p>
          <p className="realm-passport-slip realm-passport-slip-reward">5 stamps <span>→ a surprise reward</span></p>
        </div>

        <Link
          className="realm-passport-promo-button"
          to={customerUser ? '/realm-passport' : '/register'}
          state={customerUser ? undefined : { from: '/realm-passport' }}
        >
          {customerUser ? 'Open my passport' : 'Claim your passport'}
        </Link>
      </div>
    </section>
  )
}
