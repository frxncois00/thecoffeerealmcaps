import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Clock, Mail, MapPin, Phone, Star, UserRound } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import BestSellerCarousel from '../components/BestSellerCarousel'
import Reveal from '../components/Reveal'
import HowOrderingWorks from '../components/HowOrderingWorks'
import GuestAuthPrompt from '../components/customer/GuestAuthPrompt'
import { useAuth } from '../context/AuthContext'
import { store } from '../data/mockData'
import { useProductCustomization } from '../hooks/useProductCustomization'
import { isCustomerRole } from '../lib/auth'
import { CONTENT_DEFAULTS, DEFAULT_TESTIMONIALS, SYSTEM_DEFAULTS, fetchPublicPortalData } from '../services/adminPortalConfigurationService'
import { fetchMenuCatalog } from '../services/menuService'

const mapEmbed = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3859.0124735474096!2d121.05181751066577!3d14.711886674283116!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b1c4be33d913%3A0x2ab4591abe2ac00a!2sThe%20Coffee%20Realm%20-%20North%20Fairview!5e0!3m2!1sen!2sph!4v1764156842113!5m2!1sen!2sph'

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } }
const HERO_VIDEOS = ['/assets/vids/part0.mp4', '/assets/vids/part1.mp4', '/assets/vids/part2.mp4']
const HERO_FADE_SECONDS = 0.9
export default function HomePage() {
  const { user, profile } = useAuth()
  const customerUser = Boolean(user && isCustomerRole(profile?.role))
  const [guestPromptOpen, setGuestPromptOpen] = useState(false)
  const { addToCart, modal } = useProductCustomization({ modalVariant: 'menu-detail' })
  const videoRefs = useRef([])
  const activeLayerRef = useRef(0)
  const currentVideoIndexRef = useRef(0)
  const isTransitioningRef = useRef(false)
  const resetTransitionRef = useRef(null)
  const [activeLayer, setActiveLayer] = useState(0)
  const [layerSources, setLayerSources] = useState([HERO_VIDEOS[0], HERO_VIDEOS[1]])
  const [portalData, setPortalData] = useState({ content: CONTENT_DEFAULTS, system: SYSTEM_DEFAULTS, testimonials: DEFAULT_TESTIMONIALS })
  const [menuCatalog, setMenuCatalog] = useState([])
  const content = portalData.content
  const publicStore = { ...store, ...portalData.system.store }
  const featuredItems = useMemo(() => {
    const selected = (content.featured.itemIds || []).map(String)
    if (!selected.length) return menuCatalog.slice(0, 6)
    const byId = new Map(menuCatalog.map((item) => [String(item.id), item]))
    return selected.map((id) => byId.get(id)).filter(Boolean)
  }, [content.featured.itemIds, menuCatalog])

  useEffect(() => {
    let active = true
    Promise.all([fetchPublicPortalData(), fetchMenuCatalog()]).then(([configuration, catalog]) => {
      if (!active) return
      setPortalData(configuration)
      setMenuCatalog((catalog.products || []).filter((product) => product.available))
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

  useEffect(() => {
    const initialVideo = videoRefs.current[0]
    if (!initialVideo) return

    initialVideo.currentTime = 0
    initialVideo.play().catch(() => {})

    return () => {
      if (resetTransitionRef.current) window.clearTimeout(resetTransitionRef.current)
    }
  }, [])

  const transitionHeroVideo = () => {
    if (isTransitioningRef.current) return

    const outgoingLayer = activeLayerRef.current
    const incomingLayer = 1 - outgoingLayer
    const nextVideoIndex = (currentVideoIndexRef.current + 1) % HERO_VIDEOS.length
    const followingVideoIndex = (nextVideoIndex + 1) % HERO_VIDEOS.length
    const incomingVideo = videoRefs.current[incomingLayer]
    const outgoingVideo = videoRefs.current[outgoingLayer]

    if (!incomingVideo || !outgoingVideo) return

    isTransitioningRef.current = true
    incomingVideo.currentTime = 0
    incomingVideo.play().catch(() => {})
    activeLayerRef.current = incomingLayer
    currentVideoIndexRef.current = nextVideoIndex
    setActiveLayer(incomingLayer)

    if (resetTransitionRef.current) window.clearTimeout(resetTransitionRef.current)
    resetTransitionRef.current = window.setTimeout(() => {
      outgoingVideo.pause()
      outgoingVideo.currentTime = 0
      setLayerSources((currentSources) => {
        const nextSources = [...currentSources]
        nextSources[outgoingLayer] = HERO_VIDEOS[followingVideoIndex]
        return nextSources
      })
      isTransitioningRef.current = false
    }, HERO_FADE_SECONDS * 1000)
  }

  const handleHeroVideoTimeUpdate = (layerIndex) => {
    if (layerIndex !== activeLayerRef.current || isTransitioningRef.current) return
    const video = videoRefs.current[layerIndex]
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return
    if (video.duration - video.currentTime <= HERO_FADE_SECONDS) transitionHeroVideo()
  }

  const handleHeroVideoEnded = (layerIndex) => {
    if (layerIndex === activeLayerRef.current) transitionHeroVideo()
  }

  return (
    <div className="storefront customer-landing">
<main>
        <section className="hero landing-hero" id="home">
          <div className="landing-hero-media" aria-hidden="true">
            {layerSources.map((source, layerIndex) => (
              <video
                key={`${layerIndex}-${source}`}
                ref={(element) => { videoRefs.current[layerIndex] = element }}
                className={`landing-hero-video ${activeLayer === layerIndex ? 'is-active' : ''}`}
                src={source}
                muted
                playsInline
                autoPlay={layerIndex === 0}
                preload="auto"
                onTimeUpdate={() => handleHeroVideoTimeUpdate(layerIndex)}
                onEnded={() => handleHeroVideoEnded(layerIndex)}
              />
            ))}
          </div>
          <div className="landing-hero-overlay" aria-hidden="true" />
          <motion.div
            className="hero-copy"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
          >
            <motion.h1 variants={fadeUp}>{content.hero.title}</motion.h1>
            <motion.p variants={fadeUp}>{content.hero.body}</motion.p>
            <motion.div className="hero-actions" variants={fadeUp}>
              <Link className="button button-light" to={content.hero.primaryHref || '/menu'}>{content.hero.primaryLabel}</Link>
              <a className="hero-tour-link" href="/preview/realm-tour/">Preview our café tour <ArrowRight size={17} /></a>
            </motion.div>
          </motion.div>
        </section>

        <section className="marquee" aria-label="The Coffee Realm highlights">
          <span>Homemade cakes</span><i>*</i><span>Fresh cookie boxes</span><i>*</i><span>Coffee-based drinks</span><i>*</i><span>North Fairview cafe</span>
        </section>

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
              <img src="/images/about-origin.jpg" alt="Warm home interior where The Coffee Realm began" loading="lazy" />
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
            <ol className="landing-about-timeline">
              <li><span className="landing-about-timeline-marker">01</span><div><h4>2021 — Started from home</h4><p>During the pandemic, coffee was prepared and sold on a small scale from home.</p></div></li>
              <li><span className="landing-about-timeline-marker">02</span><div><h4>The pop-up chapter</h4><p>As more customers discovered the business, it moved beyond its home-based setup.</p></div></li>
              <li><span className="landing-about-timeline-marker">03</span><div><h4>A permanent home</h4><p>The journey led to a physical café in North Fairview, Quezon City.</p></div></li>
              <li><span className="landing-about-timeline-marker">04</span><div><h4>Beyond coffee</h4><p>The menu grew to include pastries, cakes, cookies, sandwiches, pasta, rice meals, and more.</p></div></li>
              <li><span className="landing-about-timeline-marker">05</span><div><h4>A growing team</h4><p>The café is now supported by a team of 15 people across daily operations.</p></div></li>
              <li><span className="landing-about-timeline-marker">06</span><div><h4>Serving our community</h4><p>Today, around 150 customers visit or order online on a typical day.</p></div></li>
            </ol>
          </Reveal>

        </section>

        <section className="section landing-reviews" id="reviews">
          <Reveal tag="div" className="reviews-intro">
            <div><span className="eyebrow">From the realm</span><h2>What our customers say.</h2></div>
          </Reveal>
          <motion.div
            className="reviews-grid-react"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
          >
            {portalData.testimonials.map((review, index) => <motion.article className={`review-card-react review-card-react--${index % 3}`} key={review.id || review.name} variants={fadeUp}>
              <div className="review-card-top"><span className="review-quote-mark">“</span><div className="review-stars" aria-label={`${review.rating || 5} star review`}>{Array.from({ length: review.rating || 5 }, (_, starIndex) => <Star key={starIndex} fill="currentColor"/>)}</div></div>
              <p>{review.quote}</p>
              <footer>
                <span className="review-author-avatar">{review.avatar_url ? <img src={review.avatar_url} alt="" /> : <UserRound size={17} />}</span>
                <b>{review.username || review.name}</b>
              </footer>
            </motion.article>)}
          </motion.div>
        </section>

        <section className="landing-map-section" id="visit">
          <Reveal tag="div" className="map-copy">
            <span className="eyebrow">Visit or contact us</span>
            <h2>Come by or get in touch.</h2>
            <p className="map-copy-intro">We’d love to welcome you in North Fairview or help you with your next coffee order.</p>
            <p><MapPin size={18} /> {publicStore.address}</p>
            <p><Clock size={18} /> Weekdays and weekends: 10:00 AM to 12:00 MN</p>
            <p><Phone size={18} /> {publicStore.phone}</p>
            <p><Mail size={18} /> <a href={`mailto:${publicStore.email}`}>{publicStore.email}</a></p>
            <a className="button button-dark" href={store.map} target="_blank" rel="noreferrer">Get directions</a>
          </Reveal>
          <Reveal tag="div" className="map-embed-react" delay={0.1}>
            <iframe title="The Coffee Realm North Fairview map" src={mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </Reveal>
        </section>
      </main>

      {modal}
      <GuestAuthPrompt open={guestPromptOpen} onClose={() => setGuestPromptOpen(false)} returnTo="/" />

    </div>
  )
}
