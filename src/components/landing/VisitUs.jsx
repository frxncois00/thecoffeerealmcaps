import { useId, useState } from 'react'
import { ArrowUpRight, Clock, Coffee, Mail, MapPin, Phone } from 'lucide-react'
import { motion } from 'framer-motion'
import { motionTokens, revealVariants } from '../../motion/config'
import { useRealmMotion } from '../../motion/useRealmMotion'
import { OpenStatus } from './LandingAccents'
import './visit-us.css'

const mapEmbed = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3859.0124735474096!2d121.05181751066577!3d14.711886674283116!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b1c4be33d913%3A0x2ab4591abe2ac00a!2sThe%20Coffee%20Realm%20-%20North%20Fairview!5e0!3m2!1sen!2sph!4v1764156842113!5m2!1sen!2sph'

const arrivalRoutes = [
  { label: 'Driving over', copy: 'Turn in from Dollar Street, then look for a parking space along Mark Street near the café.' },
  { label: 'Taking a tricycle', copy: 'Ask your driver to drop you off near Mark Street and Dollar Street in North Fairview.' },
]

const welcomeNotes = [
  { title: 'Follow the green.', copy: 'Our green storefront and The Coffee Realm name on the corner glass will let you know you’ve arrived.' },
  { title: 'A hand at the door.', copy: 'Our café is on the ground floor, with one step at the entrance. Our team is happy to help with the door.' },
]

export default function VisitUs({ store, mapUrl }) {
  const { enabled, ambient } = useRealmMotion()
  const [arrivalRoute, setArrivalRoute] = useState(0)
  const arrivalId = useId()
  const reveal = revealVariants(enabled, 24)
  const phoneHref = `tel:${store.phone.replace(/[^+\d]/g, '')}`

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
          <span className="eyebrow">Visit or contact us</span>
          <h2 id="realm-visit-title">Come by or get in touch.</h2>
          <p className="realm-visit-intro">We’d love to welcome you in North Fairview or help you with your next coffee order.</p>
          <OpenStatus />

          <address className="realm-visit-details">
            <div><MapPin size={19} aria-hidden="true" /><span>{store.address}</span></div>
            <div><Clock size={19} aria-hidden="true" /><span>Weekdays and weekends: 10:00 AM to 12:00 MN</span></div>
            <div><Phone size={19} aria-hidden="true" /><a href={phoneHref}>{store.phone}</a></div>
            <div><Mail size={19} aria-hidden="true" /><a href={`mailto:${store.email}`}>{store.email}</a></div>
          </address>

          <a className="button realm-visit-directions" href={mapUrl} target="_blank" rel="noreferrer">Get directions <ArrowUpRight size={18} aria-hidden="true" /></a>
        </motion.div>

        <motion.figure className="realm-visit-map" initial="hidden" whileInView="show" viewport={{ once: true, amount: .15 }} variants={revealVariants(enabled, 32)}>
          <div className="realm-visit-map-top"><span><MapPin size={16} aria-hidden="true" /> Find us</span><span>North Fairview, Quezon City</span></div>
          <div className="realm-visit-map-frame">
            <iframe title="The Coffee Realm North Fairview map" src={mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
          <figcaption><span>Mark Street <span aria-hidden="true">×</span> Dollar Street</span><a href={mapUrl} target="_blank" rel="noreferrer" aria-label="Open The Coffee Realm in Google Maps">Open in Maps <ArrowUpRight size={16} aria-hidden="true" /></a></figcaption>
        </motion.figure>
      </div>

      <motion.div className="realm-arrival" initial="hidden" whileInView="show" viewport={{ once: true, amount: .12 }} variants={reveal}>
        <div className="realm-arrival-masthead">
          <span>A neighborhood note</span>
          <span>North Fairview · QC</span>
        </div>
        <div className="realm-arrival-spread">
          <div className="realm-arrival-postcard">
            <div className="realm-arrival-heading">
              <h3>See you<br />at the corner.</h3>
              <span className="realm-arrival-seal" aria-hidden="true"><Coffee size={25} strokeWidth={1.3} /><span>Made for<br />slow days</span></span>
            </div>
            <figure className="realm-corner">
            <div className="realm-corner-diagram" aria-hidden="true">
              <svg viewBox="0 0 420 300" role="presentation">
                <rect className="realm-corner-block" x="21" y="22" width="200" height="136" rx="15" />
                <rect className="realm-corner-block" x="287" y="22" width="112" height="136" rx="15" />
                <rect className="realm-corner-block" x="21" y="222" width="200" height="56" rx="15" />
                <rect className="realm-corner-block" x="287" y="222" width="112" height="56" rx="15" />
                <path className="realm-corner-street" d="M0 190H420 M254 0V300" />
                <text className="realm-corner-road-label" x="58" y="195">MARK STREET</text>
                <text className="realm-corner-road-label" x="332" y="195">MARK ST.</text>
                <text className="realm-corner-road-label" transform="translate(259 88) rotate(-90)">DOLLAR ST.</text>
                <motion.path className="realm-corner-route" d="M254 270V206Q254 190 237 190H197Q183 190 183 174V153" fill="none"
                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                  transition={{ duration: enabled ? .9 : motionTokens.duration.fast, delay: enabled ? .3 : 0 }} />
                <circle className="realm-corner-start" cx="254" cy="270" r="4" />
              </svg>
              <motion.div className="realm-corner-cafe" whileHover={ambient ? { y: -5, rotate: -3 } : undefined} transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease }}>
                <Coffee size={25} strokeWidth={1.5} />
                <span>The Coffee<br />Realm</span>
              </motion.div>
              <span className="realm-corner-dot" />
              <span className="realm-corner-note">A good place to pause.</span>
            </div>
            <figcaption><span>Mark Street meets Dollar Street</span><span>Illustration · not to scale</span></figcaption>
            </figure>
          </div>
          <div className="realm-arrival-notes">
            <div className="realm-arrival-route">
              <span className="eyebrow">The last few streets</span>
              <h4 id={`${arrivalId}-label`}>Make your way to the realm.</h4>
              <div className="realm-arrival-tabs" role="tablist" aria-labelledby={`${arrivalId}-label`}>
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
            </div>
            {welcomeNotes.map(({ title, copy }) => <article className="realm-arrival-welcome" key={title}>
              <h4>{title}</h4>
              <p>{copy}</p>
            </article>)}
          </div>
        </div>
        <div className="realm-arrival-signoff"><span>A little detour. A lovely cup.</span><span>With love, TCR</span></div>
      </motion.div>
    </div>
  </section>
}
