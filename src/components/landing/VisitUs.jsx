import { useId, useState } from 'react'
import { motion } from 'framer-motion'
import { motionTokens, landingRevealVariants as revealVariants } from '../../motion/config'
import { useRealmMotion } from '../../motion/useRealmMotion'
import './visit-us.css'

const mapEmbed = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3859.0124735474096!2d121.05181751066577!3d14.711886674283116!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b1c4be33d913%3A0x2ab4591abe2ac00a!2sThe%20Coffee%20Realm%20-%20North%20Fairview!5e0!3m2!1sen!2sph!4v1764156842113!5m2!1sen!2sph'

const arrivalRoutes = [
  { label: 'Driving over', copy: 'Turn in from Dollar Street, then look for a parking space along Mark Street near the café.' },
  { label: 'Taking a tricycle', copy: 'Ask your driver to drop you off near Mark Street and Dollar Street in North Fairview.' },
]

export default function VisitUs() {
  const { enabled } = useRealmMotion()
  const [arrivalRoute, setArrivalRoute] = useState(0)
  const arrivalId = useId()
  const reveal = revealVariants(enabled, 24)

  const selectRouteWithKeyboard = (event, index) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? arrivalRoutes.length - 1 : (index + 1) % arrivalRoutes.length
    setArrivalRoute(next)
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next]?.focus()
  }

  return <section id="visit" className="realm-visit" aria-labelledby="realm-visit-title" data-visit-motion={enabled}>
    <div className="realm-visit-inner">
      <div className="realm-visit-main">
        <motion.div className="realm-visit-copy" initial="hidden" whileInView="show" viewport={{ once: true, amount: .16 }} variants={reveal}>
            <div className="realm-arrival-route">
              <h2 id="realm-visit-title">Visit our café</h2>
              <div className="realm-arrival-tabs" role="tablist" aria-labelledby="realm-visit-title">
                {arrivalRoutes.map(({ label }, index) => <button key={label} type="button" role="tab"
                  id={`${arrivalId}-tab-${index}`} aria-selected={arrivalRoute === index} aria-controls={`${arrivalId}-panel-${index}`}
                  tabIndex={arrivalRoute === index ? 0 : -1} onClick={() => setArrivalRoute(index)} onKeyDown={event => selectRouteWithKeyboard(event, index)}>
                  {arrivalRoute === index && <motion.span className="realm-arrival-tab-active" layoutId={`${arrivalId}-active`} transition={{ duration: enabled ? motionTokens.duration.base : 0, ease: motionTokens.ease }} />}
                  <span>{label}</span>
                </button>)}
              </div>
              <div className="realm-arrival-route-copy">
                {arrivalRoutes.map(({ copy }, index) => <div key={index} id={`${arrivalId}-panel-${index}`} role="tabpanel" aria-labelledby={`${arrivalId}-tab-${index}`} hidden={arrivalRoute !== index} tabIndex={0}>
                  {arrivalRoute === index && <motion.p key={arrivalRoute} initial={{ opacity: 0, y: enabled ? 6 : 0 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: enabled ? motionTokens.duration.base : motionTokens.duration.fast, ease: motionTokens.ease }}>{copy}</motion.p>}
                </div>)}
              </div>
              <figure className="realm-direction-sketch">
                <svg viewBox="0 0 720 470" role="img" aria-labelledby={`${arrivalId}-sketch-title ${arrivalId}-sketch-description`}>
                  <title id={`${arrivalId}-sketch-title`}>Directions to The Coffee Realm</title>
                  <desc id={`${arrivalId}-sketch-description`}>Follow Dollar Street and turn onto Mark Street. The Coffee Realm is beside Marianny’s Beauty Salon and Spa, across from Spark Electronic Repair Shop. Ihawan sa Dollar and MP REG Structural System Corporation are across Dollar Street, with Sureball Grill and Restobar opposite the corner.</desc>
                  <path className="realm-sketch-road" d="M418 0V470 M0 260H720" />
                  <g className="realm-sketch-blocks">
                    <rect x="8" y="8" width="370" height="223" rx="20" />
                    <rect x="458" y="8" width="254" height="223" rx="20" />
                    <rect x="8" y="300" width="370" height="162" rx="20" />
                    <rect x="458" y="300" width="254" height="162" rx="20" />
                  </g>
                  <g className="realm-sketch-street-labels">
                    <text x="45" y="266">MARK STREET</text>
                    <text transform="translate(424 175) rotate(-90)">DOLLAR ST.</text>
                  </g>
                  <g className="realm-sketch-landmarks">
                    <text x="32" y="160"><tspan x="32">Marianny’s</tspan><tspan x="32" dy="18">Beauty Salon</tspan><tspan x="32" dy="18">and Spa</tspan></text>
                    <text x="482" y="75">Ihawan sa Dollar</text>
                    <text x="482" y="167"><tspan x="482">MP REG Structural</tspan><tspan x="482" dy="18">System Corporation</tspan></text>
                    <text x="45" y="370"><tspan x="45">Spark Electronic</tspan><tspan x="45" dy="20">Repair Shop</tspan></text>
                    <text x="487" y="370"><tspan x="487">Sureball Grill</tspan><tspan x="487" dy="20">and Restobar</tspan></text>
                  </g>
                  <g className="realm-sketch-cafe" transform="rotate(-4 272 132)">
                    <rect x="188" y="61" width="169" height="145" rx="12" />
                    <path d="M259 87h22v13a11 11 0 0 1-22 0z M281 89h5a6 6 0 0 1 0 12h-5 M263 78v-5 M270 78v-5 M277 78v-5" />
                    <text x="272" y="141"><tspan x="272">The Coffee</tspan><tspan x="272" dy="27">Realm</tspan></text>
                  </g>
                  <path className="realm-sketch-route" d="M418 429V284Q418 260 394 260H314Q304 260 304 247V220" />
                  <circle className="realm-sketch-start" cx="418" cy="429" r="7" />
                  <circle className="realm-sketch-destination-halo" cx="304" cy="220" r="14" />
                  <circle className="realm-sketch-destination" cx="304" cy="220" r="8" />
                </svg>
              </figure>
            </div>
        </motion.div>

        <motion.figure className="realm-visit-map" initial="hidden" whileInView="show" viewport={{ once: true, amount: .15 }} variants={revealVariants(enabled, 32)}>
          <div className="realm-visit-map-frame">
            <iframe title="The Coffee Realm North Fairview map" src={mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </motion.figure>
      </div>


    </div>
  </section>
}
