import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Star, UserRound } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRealmMotion } from '../motion/useRealmMotion'
import { motionTokens, revealVariants } from '../motion/config'
import HeroMedia from '../components/landing/HeroMedia'
import VisitUs from '../components/landing/VisitUs'
import { LandingControls, HeroAtmosphere, RealmMarquee, StoryImage, JourneyTimeline } from '../components/landing/LandingAccents'
import { Link } from 'react-router-dom'
import BestSellerCarousel from '../components/BestSellerCarousel'
import Reveal from '../components/Reveal'
import HowOrderingWorks from '../components/HowOrderingWorks'
import GuestAuthPrompt from '../components/customer/GuestAuthPrompt'
import { useAuth } from '../context/AuthContext'
import { store } from '../data/mockData'
import { useProductCustomization } from '../hooks/useProductCustomization'
import { isCustomerRole } from '../lib/auth'
import { CONTENT_DEFAULTS, SYSTEM_DEFAULTS, fetchPublicPortalData } from '../services/adminPortalConfigurationService'
import { fetchMenuCatalog } from '../services/menuService'
import { catalog as fallbackCatalog } from '../data/customerCatalog'

// BEGIN TOUR LAUNCH — the only production-side exception; scoped to this one link.
function RealmTourLaunchLink() {
  const { enabled } = useRealmMotion()
  const reduced = !enabled
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    const reset = () => setLeaving(false)
    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [])
  const launch = event => {
    // Preserve native new-tab, modified-click, and reduced-motion navigation.
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || reduced) return
    event.preventDefault()
    setLeaving(true)
  }
  return <>
    <a className="hero-tour-link" href="/preview/realm-tour/" onClick={launch}>Preview our café tour <ArrowRight size={17} /></a>
    {leaving && createPortal(<motion.div aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : .22, ease: 'easeOut' }}
      onAnimationComplete={() => window.location.assign('/preview/realm-tour/')}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'grid', placeItems: 'center', background: '#201e16', color: '#fbf4e7', font: 'italic 32px Georgia, serif' }}>
      A little closer to the Realm.
    </motion.div>, document.body)}
  </>
}
// END TOUR LAUNCH

export default function HomePage() {
  const { user, profile } = useAuth()
  const customerUser = Boolean(user && isCustomerRole(profile?.role))
  const [guestPromptOpen, setGuestPromptOpen] = useState(false)
  const { addToCart, modal } = useProductCustomization({ modalVariant: 'menu-detail' })
  const heroRef = useRef(null)
  const { enabled, ambient } = useRealmMotion()
  const fadeUp = revealVariants(enabled)
  const [portalData, setPortalData] = useState({ content: CONTENT_DEFAULTS, system: SYSTEM_DEFAULTS, testimonials: [] })
  const [portalLoaded, setPortalLoaded] = useState(false)
  const [menuCatalog, setMenuCatalog] = useState(() => fallbackCatalog.filter((product) => product.available))
  const content = portalData.content
  const publicStore = { ...store, ...portalData.system.store }
  const featuredItems = useMemo(() => {
    const selected = (content.featured?.itemIds || []).map(String)
    const byId = new Map(menuCatalog.map((item) => [String(item.id), item]))
    const explicit = selected.map((id) => byId.get(id)).filter(Boolean)
    if (explicit.length > 0) return explicit

    const flagged = menuCatalog.filter((item) => item.isBestseller || item.isFeatured)
    if (flagged.length > 0) return flagged.slice(0, 6)

    const available = menuCatalog.slice(0, 6)
    if (available.length > 0) return available

    return fallbackCatalog.slice(0, 6)
  }, [content.featured?.itemIds, menuCatalog])

  useEffect(() => {
    let active = true
    Promise.allSettled([fetchPublicPortalData(), fetchMenuCatalog()]).then(([configResult, catalogResult]) => {
      if (!active) return
      setPortalLoaded(true)
      if (configResult.status === 'fulfilled' && configResult.value) {
        setPortalData(configResult.value)
      }
      if (catalogResult.status === 'fulfilled' && catalogResult.value) {
        const available = (catalogResult.value.products || []).filter((product) => product.available)
        if (available.length > 0) setMenuCatalog(available)
      }
    }).catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (customerUser) setGuestPromptOpen(false)
  }, [customerUser])

  const chooseFeaturedItem = (item) => {
    if (!customerUser) {
      setGuestPromptOpen(true)
      return
    }
    addToCart(item)
  }

  return (
    <div className="storefront customer-landing">
      <LandingControls />
      <main className="landing-page" id="main-content" tabIndex={-1}>
        <section ref={heroRef} className="hero landing-hero" id="home" aria-labelledby="hero-title">
          <HeroMedia heroRef={heroRef} />
          <div className="landing-hero-overlay" aria-hidden="true" />
          <motion.div
            className="hero-copy"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: enabled ? motionTokens.stagger : 0 } } }}
          >
            <motion.h1 id="hero-title" aria-label={content.hero.title} variants={fadeUp}>
              {content.hero.title.split(/\s+/).map((word, index) => <span className="realm-word-mask" aria-hidden="true" key={`${word}-${index}`}><motion.span
                initial={{ y: enabled ? '105%' : 0, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ duration: enabled ? .85 : .18, delay: enabled ? .12 + index * .065 : 0, ease: motionTokens.ease }}
              >{word}&nbsp;</motion.span></span>)}
            </motion.h1>
            <motion.p variants={fadeUp}>{content.hero.body}</motion.p>
            <motion.div className="hero-actions" variants={fadeUp}>
              <Link className="button button-light" to={content.hero.primaryHref || '/menu'}>{content.hero.primaryLabel}</Link>
              <RealmTourLaunchLink />
            </motion.div>
          </motion.div>
          <HeroAtmosphere heroRef={heroRef} />
        </section>

        <RealmMarquee />

        {content.featured.visible && <section className="section landing-menu-preview" id="menu">
          <Reveal tag="div" className="section-heading">
            <div><span className="eyebrow">{content.featured.eyebrow}</span><h2>{content.featured.title}</h2></div>
            <Link className="text-link dark" to="/menu">See full menu <ArrowRight size={17} /></Link>
          </Reveal>
          <Reveal tag="div" delay={0.1}>
            <BestSellerCarousel items={featuredItems} onChoose={chooseFeaturedItem} />
          </Reveal>
        </section>}

        <HowOrderingWorks />

        <section className="landing-about" id="about" aria-labelledby="about-title">
          <div className="landing-about-intro">
            <Reveal tag="div" className="landing-about-image-wrap">
              <StoryImage />
            </Reveal>
            <Reveal tag="div" className="landing-about-copy" delay={0.08}>
              <span className="eyebrow">Our story</span>
              <h2 id="about-title">The Coffee Realm began at home.</h2>
              <p>Founded by Mary Grace Baula Jose and Ian Jose, The Coffee Realm grew from a shared passion for coffee and years of café experience into a welcoming place for coffee, food, and desserts in North Fairview, Quezon City.</p>
              <p>What started as a small home-based business now serves both walk-in and online customers, with a growing team behind every order.</p>
            </Reveal>
          </div>

          <Reveal tag="div" className="landing-about-journey" delay={0.06}>
            <div className="landing-about-journey-heading">
              <span className="eyebrow">Our journey</span>
              <h3>Small beginnings, steady steps.</h3>
            </div>
            <JourneyTimeline>
              <Reveal tag="li" y={16}><span className="landing-about-timeline-marker">01</span><div><h4>2021 — Started from home</h4><p>During the pandemic, coffee was prepared and sold on a small scale from home.</p></div></Reveal>
              <Reveal tag="li" y={16}><span className="landing-about-timeline-marker">02</span><div><h4>The pop-up chapter</h4><p>As more customers discovered the business, it moved beyond its home-based setup.</p></div></Reveal>
              <Reveal tag="li" y={16}><span className="landing-about-timeline-marker">03</span><div><h4>A permanent home</h4><p>The journey led to a physical café in North Fairview, Quezon City.</p></div></Reveal>
              <Reveal tag="li" y={16}><span className="landing-about-timeline-marker">04</span><div><h4>Beyond coffee</h4><p>The menu grew to include pastries, cakes, cookies, sandwiches, pasta, rice meals, and more.</p></div></Reveal>
              <Reveal tag="li" y={16}><span className="landing-about-timeline-marker">05</span><div><h4>A growing team</h4><p>The café is now supported by a team of 15 people across daily operations.</p></div></Reveal>
              <Reveal tag="li" y={16}><span className="landing-about-timeline-marker">06</span><div><h4>Serving our community</h4><p>Today, around 150 customers visit or order online on a typical day.</p></div></Reveal>
            </JourneyTimeline>
          </Reveal>

        </section>

        <section className="section landing-reviews" id="reviews" aria-labelledby="reviews-title">
          <Reveal tag="div" className="reviews-intro">
            <div><span className="eyebrow">From the realm</span><h2 id="reviews-title">What our customers say.</h2></div>
          </Reveal>
          <motion.div
            className="reviews-grid-react"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: enabled ? motionTokens.stagger : 0 } } }}
          >
            {portalData.testimonials.map((review, index) => <motion.article className={`review-card-react review-card-react--${index % 3}`} key={review.id || review.name} variants={fadeUp} whileHover={ambient ? { y: -6 } : undefined}>
              <div className="review-card-top"><span className="review-quote-mark">“</span><div className="review-stars" aria-label={`${review.rating || 5} star review`}>{Array.from({ length: review.rating || 5 }, (_, starIndex) => <Star key={starIndex} fill="currentColor"/>)}</div></div>
              <p>{review.quote}</p>
              <footer>
                <span className="review-author-avatar">{review.avatar_url ? <img src={review.avatar_url} alt="" loading="lazy" decoding="async" /> : <UserRound size={17} />}</span>
                <b>{review.username || review.name}</b>
              </footer>
            </motion.article>)}
          </motion.div>
          {portalData.testimonials.length === 0 && <p className="realm-reviews-empty" role="status">{portalLoaded ? 'Customer stories are on their way.' : 'Loading customer stories…'}</p>}
        </section>

        <VisitUs store={publicStore} mapUrl={store.map} />
      </main>

      {modal}
      <GuestAuthPrompt open={guestPromptOpen} onClose={() => setGuestPromptOpen(false)} returnTo="/" />

    </div>
  )
}
