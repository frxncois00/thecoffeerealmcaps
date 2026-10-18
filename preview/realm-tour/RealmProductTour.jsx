import { lazy, Suspense, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowDown, ArrowLeft, ArrowRight, Coffee, Heart, MapPin, Pause, Play } from 'lucide-react'
import { environment, flavors, products } from './products'
import TourImage from './TourImage'
import { responsiveImage } from './responsiveImage'
import { RenderContext, useRenderBudget, useVisibleScroll } from './performance'
import { store } from '../../src/data/mockData'

// PERF: chunk loading begins after the entry module, with stable section anchors.
const CakeWheelSection = lazy(() => import('./TourChapters').then(m => ({ default: m.CakeWheelSection })))
const PastaChapterSection = lazy(() => import('./TourChapters').then(m => ({ default: m.PastaChapterSection })))
const RealmGallerySection = lazy(() => import('./TourChapters').then(m => ({ default: m.RealmGallerySection })))
function ChapterSlot({ index, children }) {
  return <div data-tour-section={index} className="tour-section tour-chapter-slot">
    <Suspense fallback={null}>{children}</Suspense>
  </div>
}

// Section order is separate from collection numbering: flavors are an interlude.
const pastaAfterIndex = products.findIndex(product => product.id === 'red-velvet-cake')
const collectionCount = products.length + 1
const tourStops = products.flatMap((product, index) => {
  const stop = { ...product, productNumber: index + 1 + Number(index > pastaAfterIndex) }
  if (index === pastaAfterIndex) return [stop, { id: 'pasta-chapter', name: 'Pasta after hours', productNumber: stop.productNumber + 1 }]
  return product.id === 'beef-tapa' ? [stop, { id: 'flavor-play', name: 'Pick your flavor' }] : [stop]
})
const cakeWheelIndex = 1
const productStartIndex = cakeWheelIndex + 1
const galleryIndex = tourStops.length + productStartIndex
const closingIndex = galleryIndex + 1
const chapters = ['Welcome', 'The Cake Wheel', ...tourStops.map(stop => stop.name), 'Around the Realm', 'See you soon']
const number = value => String(value).padStart(2, '0')

// BEGIN TOUR POLISH — shared local interactions; no menu mutations or persistence.
function MagneticAction({ reduced, className = '', children, href, ...props }) {
  const element = useRef(null)
  const x = useSpring(0, { stiffness: 230, damping: 22, mass: .3 })
  const y = useSpring(0, { stiffness: 230, damping: 22, mass: .3 })

  useEffect(() => {
    if (reduced) { x.jump(0); y.jump(0); return }
    const button = element.current
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    let bounds = null
    const reset = () => { bounds = null; x.set(0); y.set(0) }
    const move = event => {
      if (!pointer.matches || event.pointerType !== 'mouse') return
      // Cache the resting rect so following the cursor never feeds back on itself.
      bounds ??= button.getBoundingClientRect()
      x.set(Math.max(-5, Math.min(5, (event.clientX - bounds.left - bounds.width / 2) * .12)))
      y.set(Math.max(-4, Math.min(4, (event.clientY - bounds.top - bounds.height / 2) * .16)))
    }
    button.addEventListener('pointermove', move, { passive: true })
    button.addEventListener('pointerleave', reset)
    button.addEventListener('pointercancel', reset)
    button.addEventListener('blur', reset)
    button.addEventListener('click', reset)
    pointer.addEventListener('change', reset)
    return () => {
      button.removeEventListener('pointermove', move)
      button.removeEventListener('pointerleave', reset)
      button.removeEventListener('pointercancel', reset)
      button.removeEventListener('blur', reset)
      button.removeEventListener('click', reset)
      pointer.removeEventListener('change', reset)
      reset()
    }
  }, [reduced, x, y])

  const Tag = href ? motion.a : motion.button
  return <Tag ref={element} href={href} type={href ? undefined : 'button'} className={`tour-magnetic ${className}`} style={reduced ? { x: 0, y: 0 } : { x, y }} {...props}>{children}</Tag>
}

const saveParticles = Array.from({ length: 6 }, (_, index) => {
  const angle = (index * 60 - 90) * Math.PI / 180
  return { '--particle-x': `${Math.cos(angle) * 29}px`, '--particle-y': `${Math.sin(angle) * 29}px` }
})

function SaveToggle({ itemId, name, reduced, className = '' }) {
  // A single flavor control remembers each cup independently when its itemId changes.
  const [savedItems, setSavedItems] = useState({})
  const [burst, setBurst] = useState(null)
  const serial = useRef(0)
  const saved = Boolean(savedItems[itemId])
  const bursting = !reduced && burst?.itemId === itemId
  useEffect(() => { setBurst(null) }, [itemId, reduced])

  function toggle() {
    setSavedItems(current => ({ ...current, [itemId]: !current[itemId] }))
    if (!reduced) setBurst({ itemId, serial: ++serial.current })
  }

  return <button type="button" className={`tour-save ${className}`} aria-label={`Save ${name}`} aria-pressed={saved}
    title={saved ? `Unsave ${name}` : `Save ${name}`} onClick={toggle}>
    <Heart key={bursting ? `heart-${burst.serial}` : 'still'} className={bursting ? 'tour-save-pop' : undefined} size={18} strokeWidth={1.6} aria-hidden="true" />
    {bursting && <span key={`burst-${burst.serial}`} className="tour-save-burst" aria-hidden="true" onAnimationEnd={event => {
      if (event.animationName === 'tour-save-scatter') setBurst(null)
    }}>{saveParticles.map((style, index) => <i key={index} style={style} />)}</span>}
  </button>
}

function WordmarkCup() {
  return <svg className="tour-wordmark-cup" width="26" height="32" viewBox="0 0 26 32" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 17h15v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z M19 18h2a3 3 0 0 1 0 6h-2 M3 31h18" />
    <g className="tour-wordmark-steam"><path d="M7 14c-4-3 4-5 0-8" /><path d="M12 13c-4-3 4-5 0-8" /><path d="M17 14c-4-3 4-5 0-8" /></g>
  </svg>
}

// END TOUR POLISH

export default function RealmProductTour() {
  const container = useRef(null)
  const budget = useRenderBudget(container)
  const systemReduced = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const [motionOverride, setMotionOverride] = useState(false)
  const reduced = Boolean(paused || (systemReduced && !motionOverride))
  const [active, setActive] = useState(0)
  const [heroVisible, setHeroVisible] = useState(true)
  const { scrollYProgress } = useScroll({ container })

  useEffect(() => {
    const root = container.current
    const observer = new IntersectionObserver(entries => {
      const hero = entries.find(entry => entry.target.dataset.tourSection === '0')
      // A snapped-away hero can remain edge-intersecting at exactly zero pixels.
      if (hero) setHeroVisible(hero.intersectionRatio >= .01)
      const visible = entries.filter(entry => entry.isIntersecting && entry.intersectionRatio >= .5)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActive(Number(visible.target.dataset.tourSection))
    }, { root, threshold: [0, .01, .25, .5, .65] })
    root.querySelectorAll('[data-tour-section]').forEach(section => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  const goTo = useCallback(index => {
    const target = container.current?.querySelector(`[data-tour-section="${index}"]`)
    target?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' })
  }, [reduced])

  useEffect(() => {
    let lastJump = { index: 0, time: 0 }
    function navigate(event) {
      const direction = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }[event.key]
      if (!direction || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return
      const target = event.target
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="listbox"], [role="menu"]')) return
      const root = container.current
      if (!root || (target !== document.body && target instanceof Element && !target.closest('.realm-product-tour'))) return
      event.preventDefault()
      if (event.repeat) return
      const sections = Array.from(root.querySelectorAll('[data-tour-section]'))
      const now = performance.now()
      // Keep quick successive presses advancing while a smooth scroll is still settling.
      const rootTop = root.getBoundingClientRect().top
      const distances = sections.map(section => Math.abs(section.getBoundingClientRect().top - rootTop))
      const nearest = distances.indexOf(Math.min(...distances))
      const current = now - lastJump.time < 700 ? lastJump.index : nearest
      const next = Math.max(0, Math.min(chapters.length - 1, current + direction))
      lastJump = { index: next, time: now }
      goTo(next)
      root.focus({ preventScroll: true })
    }
    const resetJump = () => { lastJump.time = 0 }
    window.addEventListener('keydown', navigate)
    window.addEventListener('pointerdown', resetJump, { passive: true })
    window.addEventListener('wheel', resetJump, { passive: true })
    return () => {
      window.removeEventListener('keydown', navigate)
      window.removeEventListener('pointerdown', resetJump)
      window.removeEventListener('wheel', resetJump)
    }
  }, [goTo])

  function toggleMotion() {
    if (systemReduced && !motionOverride) {
      setMotionOverride(true)
      return
    }
    setPaused(value => !value)
  }

  return <RenderContext.Provider value={budget}><div data-quality={budget.tier} data-page-hidden={budget.hidden} className={`realm-product-tour ${reduced ? 'is-reduced' : ''}`}>
    <TourEntrance reduced={reduced} />
    <header className="tour-hud fixed inset-x-0 top-0 z-50 grid items-center px-5 md:px-10">
      <div className="tour-hud-start">
        <a className="tour-exit inline-flex items-center gap-2 justify-self-start" href="/" aria-label="Exit Tour"><ArrowLeft size={16} /><span>Exit Tour</span></a>
        <a className="tour-mini-cta" href="/menu" data-visible={!heroVisible} tabIndex={heroVisible ? -1 : undefined} aria-hidden={heroVisible}>View menu <ArrowRight size={13} /></a>
      </div>
      <a href="#welcome" onClick={event => { event.preventDefault(); goTo(0) }} className="tour-wordmark justify-self-center"><WordmarkCup />The Coffee Realm<span>THE REALM TOUR</span></a>
      <div className="tour-hud-right flex items-center justify-end gap-4">
        <button type="button" className="tour-explore-control" disabled={active >= closingIndex}
          aria-label={active >= closingIndex ? 'End of tour' : active === 0 ? 'Scroll to explore' : 'Keep exploring'}
          title={active >= closingIndex ? 'End of tour' : active === 0 ? 'Scroll to explore' : 'Keep exploring'}
          onClick={() => goTo(active + 1)}>
          <span className="tour-explore-control-label">{active >= closingIndex ? 'End of tour' : active === 0 ? 'Scroll to explore' : 'Keep exploring'}</span>
          <span className="tour-explore-control-icon" aria-hidden="true"><ArrowDown size={18} /></span>
        </button>
        <button className="tour-motion inline-flex items-center justify-center" onClick={toggleMotion} aria-pressed={reduced} aria-label={reduced ? 'Play animations' : 'Pause animations'} title={systemReduced && !motionOverride ? 'Play animations (device motion setting is on)' : reduced ? 'Resume animations' : 'Pause animations'}>{reduced ? <Play size={15} /> : <Pause size={15} />}</button>
        <div className="tour-counter"><span>{active === 0 ? 'WELCOME' : active === cakeWheelIndex ? 'DESSERTS' : active === galleryIndex ? 'THE SPACE' : active === closingIndex ? 'UNTIL NEXT TIME' : tourStops[active - productStartIndex]?.id === 'flavor-play' ? 'FLAVORS' : `${number(tourStops[active - productStartIndex]?.productNumber)} / ${number(collectionCount)}`}</span><b>{chapters[active]}</b></div>
      </div>
      <motion.div aria-hidden="true" className="tour-progress absolute bottom-0 left-0 h-px w-full origin-left" style={{ scaleX: scrollYProgress }} />
    </header>

    <nav className="tour-rail fixed z-40" aria-label="Tour sections">
      {chapters.map((chapter, index) => <button key={chapter} onClick={() => goTo(index)} aria-label={`Go to ${chapter}`} aria-current={active === index ? 'step' : undefined}><span className="tour-rail-label" aria-hidden="true">{chapter}</span><i /></button>)}
    </nav>

    <main ref={container} className="tour-scroll relative h-dvh overflow-y-auto" aria-label="The Realm product tour" tabIndex={0}>
      <EnvironmentSection container={container} index={0} image={environment.opening} reduced={reduced}>
        <div className="tour-environment-copy relative z-10 flex h-full flex-col justify-center">
          <span className="tour-kicker inline-flex items-center gap-3"><span className="tour-tiny-line" /> NORTH FAIRVIEW, QUEZON CITY</span>
          <h1>A little coffee.<br />A whole <em>realm.</em></h1>
          <p className="tour-tagline">Same coffee, extra cozy vibes.</p>
        </div>
        <div className="tour-scene-footer absolute inset-x-0 bottom-0 flex items-end justify-between"><span>THE COFFEE REALM<br /><b>EIGHT LITTLE REASONS TO STAY.</b></span><span className="text-right">A taste of the Realm.<br /><b>SCROLL AT YOUR OWN PACE.</b></span></div>
      </EnvironmentSection>

      <ChapterSlot index={cakeWheelIndex}><CakeWheelSection index={cakeWheelIndex} container={container} reduced={reduced} /></ChapterSlot>

      {tourStops.map((stop, index) => stop.id === 'flavor-play'
        ? <FlavorSection key={stop.id} index={index + productStartIndex} container={container} reduced={reduced} />
        : stop.id === 'pasta-chapter'
          ? <ChapterSlot key={stop.id} index={index + productStartIndex}><PastaChapterSection index={index + productStartIndex} chapterNumber={stop.productNumber} container={container} reduced={reduced} /></ChapterSlot>
        : <ProductSection key={stop.id} product={stop} index={stop.productNumber} sectionIndex={index + productStartIndex} container={container} reduced={reduced} />)}

      <ChapterSlot index={galleryIndex}><RealmGallerySection index={galleryIndex} container={container} reduced={reduced} /></ChapterSlot>

      <EnvironmentSection container={container} index={closingIndex} image={environment.closing} reduced={reduced}>
        <div className="tour-closing-copy relative z-10 mx-auto flex h-full max-w-4xl flex-col items-center justify-center text-center">
          <Coffee size={30} strokeWidth={1.3} className="mb-6" />
          <span className="tour-kicker">SAME PLACE. A NEW LITTLE MOMENT.</span>
          <h2>See you<br /><em>in the Realm.</em></h2>
          <p>Pull up a chair. Make yourself at home.</p>
          <div className="tour-cta-row mt-7 flex flex-wrap justify-center gap-3">
            <MagneticAction reduced={reduced} className="tour-cta inline-flex items-center justify-center gap-3" href={store.map} target="_blank" rel="noopener noreferrer"><MapPin size={17} /> Find Us</MagneticAction>
          </div>
          <button onClick={() => goTo(0)} className="tour-replay mt-4 inline-flex items-center gap-3">Back to the beginning <ArrowRight size={15} /></button>
        </div>
        <div className="tour-scene-footer absolute inset-x-0 bottom-0 flex justify-between"><span>THE COFFEE REALM</span><span>THANK YOU FOR WANDERING.</span></div>
      </EnvironmentSection>
    </main>
    <div className="tour-preview-stamp fixed bottom-4 left-1/2 z-40 -translate-x-1/2">PREVIEW / CONTENT PENDING</div>
  </div></RenderContext.Provider>
}

// BEGIN TOUR ENTRANCE — once per mount; independent of hero scroll visibility.
function TourEntrance({ reduced }) {
  const [finished, setFinished] = useState(reduced)
  useEffect(() => { if (reduced) setFinished(true) }, [reduced])
  if (reduced || finished) return null
  return <div className="tour-entry-veil" aria-hidden="true" onAnimationEnd={event => {
    if (event.target === event.currentTarget) setFinished(true)
  }}><span>A little closer to the Realm.</span></div>
}
// END TOUR ENTRANCE

// BEGIN FLAVOR PLAY — isolated interactive section; no timers or scroll interception.
function FlavorSection({ index, container, reduced }) {
  const { tier } = useContext(RenderContext)
  const section = useRef(null)
  const inView = useInView(section, { root: container, amount: .2 })
  const { scrollYProgress } = useVisibleScroll({ container, target: section, offset: ['start end', 'start start'], reduced })
  const entrance = useSpring(scrollYProgress, { stiffness: 110, damping: 26, mass: .3 })
  const cupScale = useTransform(entrance, [0, .15, .9, 1], [.97, .97, 1, 1])
  const cupOpacity = useTransform(entrance, [0, .12, .7, 1], [0, 0, 1, 1])
  const cupY = useTransform(entrance, [0, 1], [18, 0])
  const watermarkY = useTransform(entrance, [0, 1], [85, 0])
  const revealState = reduced || inView ? 'visible' : 'hidden'
  const copyReveal = {
    hidden: { opacity: 0, y: 18, transition: { duration: .15 } },
    visible: delay => ({ opacity: 1, y: 0, transition: { duration: reduced ? 0 : .45, delay: reduced ? 0 : delay, ease: [.22, 1, .36, 1] } }),
  }
  const bubbleReveal = {
    hidden: { opacity: 0, y: 18, transition: { duration: .2 } },
    visible: order => ({ opacity: 1, y: 0, transition: { duration: reduced ? 0 : .8, delay: reduced ? 0 : .1 + order * .12, ease: [.22, 1, .36, 1] } }),
  }
  const [selected, setSelected] = useState(0)
  const flavor = flavors[selected]
  const fade = { duration: reduced ? 0 : .6, ease: 'easeInOut' }

  useEffect(() => {
    if (!inView) return
    // Warm the remaining cups when this section approaches, so the first tap fades cleanly.
    // PERF: warm only compressed, size-matched cups; never download original PNGs.
    flavors.forEach(item => { const image = new Image(); Object.assign(image, responsiveImage(`/images/realm-tour/${item.cup}`, tier, '(max-width: 640px) 55vw, 430px')) })
  }, [inView, tier])

  function chooseFlavor(next) {
    if (next === selected) return
    setSelected(next)
  }

  return <section ref={section} id="flavor-play" data-tour-section={index} data-active={inView}
    className="tour-section tour-flavor" aria-labelledby="tour-flavor-heading" style={{ '--flavor-accent': flavor.accent }}>
    <AnimatePresence initial={false}>
      <motion.div key={flavor.id} className="tour-flavor-atmosphere" aria-hidden="true"
        style={{ backgroundColor: flavor.color, '--flavor-mist': flavor.mist }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}>
        <div className="tour-flavor-mist" />
      </motion.div>
    </AnimatePresence>
    <div className="tour-flavor-intro">
      <motion.span className="tour-kicker" initial={reduced ? false : 'hidden'} animate={revealState} variants={copyReveal} custom={0}>A LITTLE SWIRL. A WHOLE NEW MOOD.</motion.span>
      <motion.h2 id="tour-flavor-heading" initial={reduced ? false : 'hidden'} animate={revealState} variants={copyReveal} custom={.08}>Go with your <em>craving.</em></motion.h2>
      <motion.p id="tour-flavor-help" initial={reduced ? false : 'hidden'} animate={revealState} variants={copyReveal} custom={.16}>Tap a floating flavor. Find your kind of cozy.</motion.p>
    </div>
    <div className="tour-flavor-stage">
      <AnimatePresence initial={false}>
        <motion.div key={flavor.id} className="tour-flavor-scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}>
          <motion.div className="tour-flavor-depth" style={reduced ? undefined : { y: watermarkY }} aria-hidden="true">
            <span className="tour-flavor-watermark">{flavor.word}</span>
          </motion.div>
          <motion.div className="tour-flavor-cup-entry" style={reduced ? undefined : { scale: cupScale, opacity: cupOpacity, y: cupY }}>
            {/* A restrained upward reveal accompanies the crossfade on selection. */}
            <div className={`tour-flavor-cup ${inView && !reduced ? 'is-revealing' : ''}`}>
              <TourImage sizes="(max-width: 640px) 55vw, 430px" src={`/images/realm-tour/${flavor.cup}`} alt={`${flavor.name} in an iced glass`} width={flavor.width} height={flavor.height} decoding="async" loading="lazy" draggable="false" />
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <div className="tour-flavor-choices" role="group" aria-label="Choose your flavor" aria-describedby="tour-flavor-help">
        {flavors.map((item, flavorIndex) => <motion.div className={`tour-flavor-bubble tour-flavor-bubble-${flavorIndex + 1}`} key={item.id}
          initial={reduced ? false : 'hidden'} animate={revealState} variants={bubbleReveal} custom={flavorIndex}>
          {/* The button travels with both drift axes; its hit target follows the artwork. */}
          <div className="tour-flavor-drift"><div className="tour-flavor-bob">
            <button type="button" onClick={() => chooseFlavor(flavorIndex)} aria-pressed={selected === flavorIndex} aria-label={`Choose ${item.name}`}>
              <TourImage sizes="(max-width: 640px) 20vw, 145px" src={`/images/realm-tour/${item.bubble}`} alt="" width="128" height="128" loading="lazy" decoding="async" draggable="false" />
              <span>{item.name}</span>
            </button>
          </div></div>
        </motion.div>)}
      </div>
    </div>
    <div className="tour-flavor-footer">
      <div className="tour-flavor-selection">
        <div className="tour-flavor-selected" role="status" aria-live="polite" aria-atomic="true"><span>YOUR CURRENT CRAVING</span><strong>{flavor.name}</strong></div>
        <SaveToggle itemId={flavor.id} name={flavor.name} reduced={reduced} />
      </div>
    </div>
  </section>
}
// END FLAVOR PLAY

function ProductSection({ product, index, sectionIndex, container, reduced }) {
  const { tier } = useContext(RenderContext)
  const depth = tier === 'low' ? .65 : 1
  const ref = useRef(null)
  const inView = useInView(ref, { root: container, amount: .2 })
  const { scrollYProgress } = useVisibleScroll({ container, target: ref, offset: ['start end', 'end start'], reduced })
  const timeline = useSpring(scrollYProgress, { stiffness: 115, damping: 28, mass: .32 })
  // Keep the existing motion directions independent of collection numbering.
  const direction = product.id === 'biscoff-latte' ? -1 : 1
  const imageX = useTransform(timeline, [0, .18, .5, .82, 1], [direction * 125, direction * 45, 0, direction * -35, direction * -130])
  const imageY = useTransform(timeline, [0, .18, .5, .82, 1], [190, 75, 0, -55, -210])
  const imageScale = useTransform(timeline, [0, .2, .5, .82, 1], [.68, .88, 1.04, 1.08, .78])
  const imageRotate = useTransform(timeline, [0, .2, .5, .82, 1], [direction * 15, direction * 7, direction * -2, direction * -5, direction * -14])
  const imageOpacity = useTransform(timeline, [0, .13, .82, 1], [0, 1, 1, 0])
  const copyX = useTransform(timeline, [0, .22, .72, 1], [direction * -105, 0, 0, direction * 75])
  const copyY = useTransform(timeline, [0, .22, .72, 1], [65, 0, 0, -75])
  const copyOpacity = useTransform(timeline, [0, .18, .78, 1], [0, 1, 1, 0])
  const copyScale = useTransform(timeline, [0, .22, .72, 1], [.94, 1, 1, .97])
  const orbitScale = useTransform(timeline, [0, .18, .5, .82, 1], [.62, .86, 1, 1.14, 1.34])
  const orbitRotate = useTransform(timeline, [0, 1], [-38, 34])
  const orbitOpacity = useTransform(timeline, [0, .16, .72, 1], [0, .45, .28, 0])
  const shadowScale = useTransform(timeline, [0, .5, 1], [.45, 1, .55])
  const shadowOpacity = useTransform(timeline, [0, .5, 1], [0, .24, 0])
  const badgeX = useTransform(timeline, [0, .5, 1], [direction * 36, 0, direction * -42])
  const badgeY = useTransform(timeline, [0, .5, 1], [48, 0, -62])
  const watermarkX = useTransform(timeline, [0, 1], [direction * 100 * depth, direction * -120 * depth])
  const watermarkRotate = useTransform(timeline, [0, 1], [-5, 4])
  const ghostY = useTransform(timeline, [0, .5, 1], [130 * depth, 0, -150 * depth])
  const strokeScale = useTransform(timeline, [0, .22, .78, 1], [0, 1, 1, 0])
  const [imageFailed, setImageFailed] = useState(false)
  return <section ref={ref} id={product.id} data-tour-section={sectionIndex} data-active={inView} className={`tour-section tour-product tour-theme-${product.theme} relative`} aria-labelledby={`${product.id}-heading`}>
    <div className="tour-product-grain absolute inset-0" aria-hidden="true" />
    <motion.span className="tour-ghost-index absolute" aria-hidden="true" style={reduced ? undefined : { y: ghostY }}>{number(index)}</motion.span>
    {product.word && <motion.span className="tour-watermark absolute" aria-hidden="true" style={reduced ? undefined : { x: watermarkX, rotate: watermarkRotate }}>{product.word}</motion.span>}
    <motion.span className="tour-scroll-stroke absolute" aria-hidden="true" style={reduced ? undefined : { scaleX: strokeScale }} />
    <div className="tour-product-layout relative z-10 grid h-full items-center">
      <motion.div className="tour-product-copy" style={reduced ? undefined : { x: copyX, y: copyY, opacity: copyOpacity, scale: copyScale }}>
        <span className="tour-kicker flex items-center gap-3"><span className="tour-tiny-line" /> {product.category.toUpperCase()} / {number(index)}</span>
        <h2 id={`${product.id}-heading`}>{product.name}</h2>
        <div className="tour-product-details"><p>{product.price}{product.priceUnit && ` (${product.priceUnit})`} <span aria-hidden="true">/</span> {product.description}</p>
          {['beef-tapa', 'biscoff-latte', 'red-velvet-cake', 'biscoff-burnt-cheesecake'].includes(product.id) && <SaveToggle itemId={product.id} name={product.name} reduced={reduced} className="tour-product-save" />}
        </div>
      </motion.div>
      <div className={`tour-product-stage tour-shape-${product.shape} relative flex items-center justify-center`}>
        <motion.span className="tour-product-orbit absolute" aria-hidden="true" style={reduced ? undefined : { scale: orbitScale, rotate: orbitRotate, opacity: orbitOpacity }} />
        <motion.span className="tour-ground-shadow absolute" aria-hidden="true" style={reduced ? undefined : { scaleX: shadowScale, opacity: shadowOpacity }} />
        {imageFailed ? <div className="tour-image-fallback" role="img" aria-label={`${product.name} photo unavailable`}>Photo unavailable</div> : <TourImage as={motion.img}
          className="tour-cutout relative z-10 h-full w-full object-contain"
          sizes="(max-width: 640px) 90vw, 50vw" src={product.image} alt={product.name} width="1200" height="1200"
          loading="lazy" decoding="async" draggable="false"
          onError={() => setImageFailed(true)}
          style={reduced ? undefined : { x: imageX, y: imageY, scale: imageScale, rotate: imageRotate, opacity: imageOpacity }}

        />}
        <motion.div className="tour-badge-anchor absolute z-20" style={reduced ? undefined : { x: badgeX, y: badgeY }}><span className="tour-floating-badge inline-flex items-center gap-2"><i />{product.badge}</span></motion.div>
      </div>
    </div>
    <div className="tour-product-footer absolute inset-x-0 bottom-0 flex justify-between"><span>THE COFFEE REALM / THE COLLECTION</span><span>{number(index)} <span className="opacity-50">/ {number(collectionCount)}</span></span></div>
  </section>
}

function EnvironmentSection({ index, image, container, reduced, children }) {
  const ref = useRef(null)
  const [arrived, setArrived] = useState(reduced)
  useEffect(() => { if (reduced) setArrived(true) }, [reduced])
  const tiltX = useSpring(0, { stiffness: 90, damping: 24 })
  const tiltY = useSpring(0, { stiffness: 90, damping: 24 })
  useEffect(() => {
    if (index !== 0 || reduced) return
    const surface = ref.current
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    let bounds
    const reset = () => { bounds = null; tiltX.set(0); tiltY.set(0) }
    const move = event => {
      if (!pointer.matches || event.pointerType !== 'mouse') return
      bounds ??= surface.getBoundingClientRect()
      tiltX.set(-((event.clientY - bounds.top) / bounds.height - .5) * 3)
      tiltY.set(((event.clientX - bounds.left) / bounds.width - .5) * 3)
    }
    surface.addEventListener('pointermove', move, { passive: true })
    surface.addEventListener('pointerleave', reset)
    pointer.addEventListener('change', reset)
    return () => {
      surface.removeEventListener('pointermove', move)
      surface.removeEventListener('pointerleave', reset)
      pointer.removeEventListener('change', reset)
      reset()
    }
  }, [index, reduced, tiltX, tiltY])
  const inView = useInView(ref, { root: container, amount: .15 })
  const { scrollYProgress } = useVisibleScroll({ container, target: ref, offset: ['start end', 'end start'], reduced })
  const timeline = useSpring(scrollYProgress, { stiffness: 95, damping: 30, mass: .35 })
  const backdropScale = useTransform(timeline, [0, .5, 1], [1.08, 1, 1.09])
  const backdropY = useTransform(timeline, [0, 1], [28, -28])
  const contentY = useTransform(timeline, [0, .45, .55, 1], [90, 0, 0, -110])
  const contentScale = useTransform(timeline, [0, .45, .55, 1], [.95, 1, 1, .96])
  const contentOpacity = useTransform(timeline, [0, .16, .82, 1], [0, 1, 1, 0])
  return <section ref={ref} id={index === 0 ? 'welcome' : 'visit'} data-tour-section={index} data-active={inView} className="tour-section tour-environment relative" aria-label={index === 0 ? 'Welcome to The Coffee Realm' : 'See you in the Realm'}>
    <div className="tour-backdrop absolute inset-0 overflow-hidden">
      {index === 0 ? <div className="tour-hero-reveal" data-arrived={arrived} onAnimationEnd={() => setArrived(true)}><motion.div className="tour-hero-tilt" style={reduced ? undefined : { rotateX: tiltX, rotateY: tiltY, transformPerspective: 1200 }}>
        <TourImage as={motion.img} src={image} alt="" className="h-full w-full object-cover" loading="eager" fetchPriority="high" decoding="async" style={reduced ? undefined : { scale: backdropScale, y: backdropY }} />
      </motion.div></div> : <TourImage as={motion.img} src={image} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" style={reduced ? undefined : { scale: backdropScale, y: backdropY }} />}
    </div>
    <div className="tour-environment-overlay absolute inset-0" />
    <motion.div className="tour-environment-content relative z-10 h-full w-full" style={reduced ? undefined : { y: contentY, scale: contentScale, opacity: contentOpacity }}>{children}</motion.div>
  </section>
}
