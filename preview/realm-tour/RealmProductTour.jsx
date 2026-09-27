import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowDown, ArrowLeft, ArrowRight, ChefHat, Coffee, Flame, Leaf, MapPin, Pause, Play, UtensilsCrossed, X } from 'lucide-react'
import { cakeSlices, environment, flavors, galleryPhotos, pastaDishes, products } from './products'

// Section order is separate from collection numbering: flavors are an interlude.
const pastaAfterIndex = products.findIndex(product => product.id === 'smores')
const collectionCount = products.length + 1
const tourStops = products.flatMap((product, index) => {
  const stop = { ...product, productNumber: index + 1 + Number(index > pastaAfterIndex) }
  if (index === pastaAfterIndex) return [stop, { id: 'pasta-chapter', name: 'Pasta after hours', productNumber: stop.productNumber + 1 }]
  return product.id === 'biscoff-latte' ? [stop, { id: 'flavor-play', name: 'Pick your flavor' }] : [stop]
})
const cakeWheelIndex = 1
const productStartIndex = cakeWheelIndex + 1
const galleryIndex = tourStops.length + productStartIndex
const closingIndex = galleryIndex + 1
const chapters = ['Welcome', 'The Cake Wheel', ...tourStops.map(stop => stop.name), 'Around the Realm', 'See you soon']
const number = value => String(value).padStart(2, '0')

export default function RealmProductTour() {
  const container = useRef(null)
  const systemReduced = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const [motionOverride, setMotionOverride] = useState(false)
  const reduced = Boolean(paused || (systemReduced && !motionOverride))
  const [active, setActive] = useState(0)
  const [heroVisible, setHeroVisible] = useState(true)
  const [notice, setNotice] = useState('')
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

  function placeholderAction(action) {
    // TODO: supply the approved menu URL and location URL before publishing.
    // These intentionally do not guess or navigate to production routes.
    setNotice(`${action}: preview only. Destination has not been configured yet.`)
  }

  function toggleMotion() {
    if (systemReduced && !motionOverride) {
      setMotionOverride(true)
      return
    }
    setPaused(value => !value)
  }

  return <div className={`realm-product-tour ${reduced ? 'is-reduced' : ''}`}>
    <TourEntrance reduced={reduced} />
    <header className="tour-hud fixed inset-x-0 top-0 z-50 grid items-center px-5 md:px-10">
      <div className="tour-hud-start">
        <a className="tour-exit inline-flex items-center gap-2 justify-self-start" href="/"><ArrowLeft size={16} /><span>Exit Tour</span></a>
        <a className="tour-mini-cta" href="/menu" data-visible={!heroVisible} tabIndex={heroVisible ? -1 : undefined} aria-hidden={heroVisible}>View menu <ArrowRight size={13} /></a>
      </div>
      <a href="#welcome" onClick={event => { event.preventDefault(); goTo(0) }} className="tour-wordmark justify-self-center">The Coffee Realm<span>THE REALM TOUR</span></a>
      <div className="tour-hud-right flex items-center justify-end gap-4">
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
          <button onClick={() => goTo(1)} className="tour-explore inline-flex items-center gap-6 self-start">Scroll to explore <span><ArrowDown size={18} /></span></button>
        </div>
        <div className="tour-scene-footer absolute inset-x-0 bottom-0 flex items-end justify-between"><span>THE COFFEE REALM<br /><b>EIGHT LITTLE REASONS TO STAY.</b></span><span className="text-right">A taste of the Realm.<br /><b>SCROLL AT YOUR OWN PACE.</b></span></div>
      </EnvironmentSection>

      <CakeWheelSection index={cakeWheelIndex} container={container} reduced={reduced} onNext={() => goTo(productStartIndex)} />

      {tourStops.map((stop, index) => stop.id === 'flavor-play'
        ? <FlavorSection key={stop.id} index={index + productStartIndex} container={container} reduced={reduced} onNext={() => goTo(index + productStartIndex + 1)} />
        : stop.id === 'pasta-chapter'
          ? <PastaChapterSection key={stop.id} index={index + productStartIndex} chapterNumber={stop.productNumber} container={container} reduced={reduced} onNext={() => goTo(index + productStartIndex + 1)} />
        : <ProductSection key={stop.id} product={stop} index={stop.productNumber} sectionIndex={index + productStartIndex} container={container} reduced={reduced} onNext={() => goTo(index + productStartIndex + 1)} />)}

      <RealmGallerySection index={galleryIndex} container={container} reduced={reduced} />

      <EnvironmentSection container={container} index={closingIndex} image={environment.closing} reduced={reduced}>
        <div className="tour-closing-copy relative z-10 mx-auto flex h-full max-w-4xl flex-col items-center justify-center text-center">
          <Coffee size={30} strokeWidth={1.3} className="mb-6" />
          <span className="tour-kicker">SAME PLACE. A NEW LITTLE MOMENT.</span>
          {/* Admin counts are private; the homepage's daily estimate is static copy, not a verified aggregate. */}
          <div className="tour-social-proof"><span>SOCIAL PROOF / CONTENT PENDING</span>[ADD: verified order count or review stat]</div>
          <h2>See you<br /><em>in the Realm.</em></h2>
          <p>Pull up a chair. Make yourself at home.</p>
          <div className="tour-cta-row mt-7 flex flex-wrap justify-center gap-3">
            <button className="tour-cta tour-cta-primary inline-flex items-center justify-center gap-5" onClick={() => placeholderAction('Explore Full Menu')}>Explore Full Menu <ArrowRight size={17} /></button>
            <button className="tour-cta inline-flex items-center justify-center gap-3" onClick={() => placeholderAction('Find Us')}><MapPin size={17} /> Find Us</button>
          </div>
          <p className="tour-cta-notice" role="status">{notice || 'Preview buttons only. Destinations pending.'}</p>
          <button onClick={() => goTo(0)} className="tour-replay mt-4 inline-flex items-center gap-3">Back to the beginning <ArrowRight size={15} /></button>
        </div>
        <div className="tour-scene-footer absolute inset-x-0 bottom-0 flex justify-between"><span>THE COFFEE REALM</span><span>THANK YOU FOR WANDERING.</span></div>
      </EnvironmentSection>
    </main>
    <div className="tour-preview-stamp fixed bottom-4 left-1/2 z-40 -translate-x-1/2">PREVIEW / CONTENT PENDING</div>
  </div>
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

// BEGIN CAKE WHEEL — one snap stop; CSS rotation keeps the nine windows upright.
const cakeGondolas = cakeSlices.map((cake, index) => {
  const angle = (index * 360 / cakeSlices.length - 90) * Math.PI / 180
  return { ...cake, x: 50 + Math.cos(angle) * 50, y: 50 + Math.sin(angle) * 50 }
})

function CakeWheelSection({ index, container, reduced, onNext }) {
  const section = useRef(null)
  const inView = useInView(section, { root: container, amount: .1 })
  const entered = useInView(section, { root: container, amount: .35, once: true })
  const [assembled, setAssembled] = useState(reduced)
  useEffect(() => { if (reduced) setAssembled(true) }, [reduced])

  // A named region preserves the existing product sections' nth-of-type styling.
  return <div ref={section} id="cake-wheel" role="region" aria-labelledby="tour-cake-heading"
    data-tour-section={index} data-in-view={inView} data-entered={entered} data-assembled={assembled}
    data-spinning={inView && assembled && !reduced} className="tour-section tour-cake-wheel">
    <div className="tour-cake-atmosphere" aria-hidden="true"><i /><i /><i /><i /></div>
    <div className="tour-cake-copy">
      <span className="tour-kicker">THE SWEETER SIDE OF THE REALM</span>
      <h2 id="tour-cake-heading">Let the good<br />things <em>go round.</em></h2>
    </div>
    <div className="tour-cake-stage">
      <div className="tour-cake-halo" aria-hidden="true" />
      <div className="tour-cake-assembly">
        <svg className="tour-cake-support" viewBox="0 0 1000 1100" fill="none" aria-hidden="true">
          <path className="tour-cake-support-shadow" d="M500 490 335 1035 M500 490 665 1035 M280 1035H720" />
          <path className="tour-cake-support-edge" d="M500 490 335 1035 M500 490 665 1035 M280 1035H720" />
          <path className="tour-cake-support-brace" d="M395 845H605" />
        </svg>
        <ol className="tour-cake-rotor" aria-label="Nine cake slices on the Realm Ferris wheel">
          {/* Decorative structure shares the rotor's clock with all nine gondolas. */}
          <li className="tour-cake-frame" aria-hidden="true">
            <svg viewBox="0 0 500 500" fill="none">
              <circle className="tour-cake-rim" cx="250" cy="250" r="248" />
              <circle className="tour-cake-inner-rim" cx="250" cy="250" r="229" />
              {cakeGondolas.map(cake => <path className="tour-cake-spoke" key={cake.file} d={`M250 250 L${cake.x * 5} ${cake.y * 5}`} />)}
              {cakeGondolas.map((cake, i) => {
                const angle = (i * 360 / cakeGondolas.length - 70) * Math.PI / 180
                return <circle className="tour-cake-light" key={cake.file} cx={250 + Math.cos(angle) * 238} cy={250 + Math.sin(angle) * 238} r="3.5" />
              })}
              {/* Three opacity groups give 27 tiny bulbs a quiet marquee rhythm. */}
              {[0, 1, 2].map(group => <g className="tour-cake-marquee" key={group} style={{ '--light-delay': `${group * -1.6}s` }}>
                {cakeGondolas.map((cake, i) => {
                  const angle = ((i * 3 + group) * 360 / 27 - 90) * Math.PI / 180
                  return <circle key={cake.file} cx={250 + Math.cos(angle) * 248} cy={250 + Math.sin(angle) * 248} r="1.8" />
                })}
              </g>)}
            </svg>
          </li>
          {cakeGondolas.map((cake, i) => <li className="tour-cake-gondola" key={cake.file} style={{ left: `${cake.x}%`, top: `${cake.y}%`, '--cake-order': i, '--cake-entry-x': `${(50 - cake.x) / .28}%`, '--cake-entry-y': `${(50 - cake.y) / .28}%` }}>
            <div className="tour-cake-counterspin">
              <div className="tour-cake-arrival" onAnimationEnd={event => {
                if (event.animationName === 'tour-cake-find-place' && i === cakeGondolas.length - 1) setAssembled(true)
              }}>
                <div className="tour-cake-swing">
                  <div className="tour-cake-window"><img src={`/images/realm-tour/${cake.file}`} alt={cake.alt} width="1024" height="1024" loading="lazy" decoding="async" draggable="false" /></div>
                  <span className="tour-cake-ticket" aria-hidden="true">{number(i + 1)}</span>
                </div>
              </div>
            </div>
          </li>)}
        </ol>
        <div className="tour-cake-hub" aria-hidden="true"><Coffee strokeWidth={1.2} /><span>REALM</span></div>
      </div>
      <div className="tour-cake-ground" aria-hidden="true" />
    </div>
    <div className="tour-cake-footer"><button type="button" onClick={onNext}>Keep exploring <ArrowDown size={16} /></button></div>
  </div>
}
// END CAKE WHEEL

// BEGIN PASTA CHAPTER — one snap region; no wheel/touch interception or recipe guesses.
const pastaRibbon = 'M-90 85 C60 155 135 190 260 205 S595 210 750 270 S1000 345 900 395 C790 465 635 330 460 400 S155 440 160 505 C165 590 340 540 440 555 S640 625 780 585 S1050 600 1070 675'
const pastaIcons = [UtensilsCrossed, Leaf, Flame, ChefHat]

function PastaChapterSection({ index, chapterNumber, container, reduced, onNext }) {
  const section = useRef(null)
  const profile = useRef(null)
  const dishButtons = useRef({})
  const inView = useInView(section, { root: container, amount: .1 })
  const entered = useInView(section, { root: container, amount: .25, once: true })
  const [selectedId, setSelectedId] = useState(null)
  const selected = pastaDishes.find(dish => dish.id === selectedId)

  useEffect(() => {
    if (selectedId) profile.current?.focus({ preventScroll: true })
  }, [selectedId])
  useEffect(() => { if (!inView) setSelectedId(null) }, [inView])
  useEffect(() => {
    if (!selectedId) return
    const outside = event => {
      if (event.target instanceof Element && !event.target.closest('.tour-pasta-profile, .tour-pasta-dish-button')) setSelectedId(null)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [selectedId])

  function closeProfile() {
    setSelectedId(null)
    dishButtons.current[selectedId]?.focus({ preventScroll: true })
  }
  const reveal = (delay, y = 20, duration = .6) => ({
    initial: false,
    animate: { opacity: reduced || entered ? 1 : 0, y: reduced || entered ? 0 : y },
    transition: { duration: reduced ? 0 : duration, delay: reduced || !entered ? 0 : delay, ease: [.22, 1, .36, 1] },
  })
  const draw = { initial: false, animate: { pathLength: reduced || entered ? 1 : 0 }, transition: { duration: reduced ? 0 : 3.6, ease: [.22, 1, .36, 1] } }

  // A div region leaves the neighboring products' section:nth-of-type styling intact.
  return <div ref={section} id="pasta-chapter" role="region" aria-labelledby="tour-pasta-heading"
    className="tour-section tour-pasta" data-tour-section={index} data-active={inView && !reduced} data-entered={entered || reduced}
    onKeyDown={event => { if (event.key === 'Escape' && selected) { event.preventDefault(); event.stopPropagation(); closeProfile() } }}>
    <div className="tour-pasta-lights" aria-hidden="true">
      {[0, 1, 2, 3, 4].map(light => <div key={light} className={`tour-pasta-lamp tour-pasta-lamp-${light + 1}`} style={{ '--lamp-delay': `${light * .12}s` }}>
        <span className="tour-pasta-wire" /><span className="tour-pasta-socket" /><span className="tour-pasta-bulb"><i /></span>
      </div>)}
    </div>
    <div className="tour-pasta-intro">
      <motion.span className="tour-kicker" {...reveal(0)}>PASTA / {number(chapterNumber)} — A WARMER KIND OF EVENING</motion.span>
      <motion.h2 id="tour-pasta-heading" {...reveal(.08)}>Stay for the <em>slow swirl.</em></motion.h2>
      <motion.p {...reveal(.16)}>Four plates worth lingering over. Tap one to see what goes in.</motion.p>
    </div>
    <div className="tour-pasta-stage">
      <svg className="tour-pasta-scenery" viewBox="0 0 1000 640" preserveAspectRatio="none" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="tour-pasta-wood" x1="0" x2="1"><stop stopColor="#17110d" /><stop offset=".3" stopColor="#4e3322" /><stop offset=".53" stopColor="#281b14" /><stop offset=".8" stopColor="#63422b" /><stop offset="1" stopColor="#1c1510" /></linearGradient>
          <linearGradient id="tour-pasta-brass"><stop stopColor="#6b4829" /><stop offset=".35" stopColor="#e5be7a" /><stop offset=".7" stopColor="#b68b52" /><stop offset="1" stopColor="#68492c" /></linearGradient>
          <linearGradient id="tour-pasta-cream" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b68555" /><stop offset=".25" stopColor="#f2dcb0" /><stop offset=".5" stopColor="#b18354" /><stop offset=".72" stopColor="#f5e1b8" /><stop offset="1" stopColor="#9e7044" /></linearGradient>
          <linearGradient id="tour-pasta-vapor" x1="0" y1="1" x2="0" y2="0"><stop stopColor="#fbf4e7" stopOpacity="0" /><stop offset=".45" stopColor="#ead8b8" stopOpacity=".7" /><stop offset="1" stopColor="#fbf4e7" stopOpacity="0" /></linearGradient>
        </defs>
        <g className="tour-pasta-posts">
          {[[215, 242], [795, 286], [220, 545], [815, 574]].map(([x, y]) => <g key={x + ':' + y} transform={`translate(${x} ${y})`}>
            <ellipse cx="0" cy="91" rx="53" ry="15" fill="#100b08" opacity=".65" />
            <rect x="-38" y="0" width="76" height="90" rx="13" fill="url(#tour-pasta-wood)" />
            <path d="M-27 15V78 M-18 16V84 M8 16V85 M22 15V80" stroke="#bb9456" strokeOpacity=".16" />
            <ellipse rx="41" ry="14" fill="#352318" stroke="url(#tour-pasta-brass)" strokeWidth="4" />
            <path d="M-38 17Q0 40 38 17 M-38 75Q0 97 38 75" stroke="url(#tour-pasta-brass)" strokeWidth="4" />
            <path d="M0 0C-7-40 4-57 47-62" stroke="#21170f" strokeWidth="48" strokeLinecap="round" />
            <path d="M-8-8C-15-43 4-54 42-58" stroke="#86613a" strokeWidth="3" strokeLinecap="round" />
          </g>)}
        </g>
        <g className="tour-pasta-ribbon" strokeLinecap="round">
          <motion.path d={pastaRibbon} stroke="#684327" strokeWidth="55" opacity=".28" {...draw} />
          <motion.path d={pastaRibbon} stroke="url(#tour-pasta-cream)" strokeWidth="35" {...draw} />
          <motion.path d={pastaRibbon} stroke="#fff1ce" strokeWidth="10" opacity=".3" {...draw} />
          <motion.path d={pastaRibbon} stroke="#fbebc9" strokeWidth="2" opacity=".65" transform="translate(0 -10)" {...draw} />
        </g>
        <g className="tour-pasta-herbs" fill="#778464">
          {[[430, 231, -25], [452, 243, 30], [469, 228, 65], [603, 384, -20], [624, 377, 55], [358, 551, 25], [382, 548, -45], [892, 592, 35]].map(([x, y, turn]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="3.5" ry="7" transform={`rotate(${turn} ${x} ${y})`} />)}
        </g>
      </svg>
      <motion.div className="tour-pasta-steam" aria-hidden="true" {...reveal(.5, 0)}>
        <svg viewBox="0 0 1000 640" preserveAspectRatio="none" fill="none" stroke="url(#tour-pasta-vapor)" strokeLinecap="round">
          <g className="tour-pasta-wisp tour-pasta-wisp-1"><path d="M190 305C115 230 350 195 268 130S218 52 330 5" /><path d="M275 288C195 228 402 170 320 94S330 35 374-10" /></g>
          <g className="tour-pasta-wisp tour-pasta-wisp-2"><path d="M696 372C587 277 880 237 770 147S738 55 820-20" /><path d="M784 348C720 275 942 227 844 155S850 32 902 10" /></g>
          <g className="tour-pasta-wisp tour-pasta-wisp-3"><path d="M305 640C230 548 570 475 480 395S460 317 570 260" /><path d="M734 669C628 546 804 508 699 430S693 380 751 332" /></g>
        </svg>
      </motion.div>
      {pastaDishes.map((dish, dishIndex) => {
        const Icon = pastaIcons[dishIndex]
        return <div key={dish.id} className={`tour-pasta-stop tour-pasta-stop-${dishIndex + 1}`}>
          <motion.div className="tour-pasta-dish-entry" {...reveal(.45 + dishIndex * .65, 38, 1.2)}>
            <button ref={element => { dishButtons.current[dish.id] = element }} type="button" className="tour-pasta-dish-button"
              aria-label={`${dish.name} ingredients`} aria-expanded={selectedId === dish.id} aria-controls={selectedId === dish.id ? 'tour-pasta-profile' : undefined}
              onClick={() => setSelectedId(current => current === dish.id ? null : dish.id)}>
              <span className="tour-pasta-plate"><img src={`/images/realm-tour/${dish.file}`} alt="" width="1371" height="1148" loading="lazy" decoding="async" draggable="false" /><span className="tour-pasta-badge" aria-hidden="true"><Icon size={19} strokeWidth={1.25} /></span></span>
              <span className="tour-pasta-dish-name">{dish.name}<span aria-hidden="true">+</span></span>
            </button>
          </motion.div>
        </div>
      })}
      <AnimatePresence>
        {selected && <motion.aside key="pasta-profile" ref={profile} tabIndex={-1} id="tour-pasta-profile" role="region" aria-labelledby="tour-pasta-profile-title"
          className="tour-pasta-profile" initial={{ opacity: 0, y: reduced ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .18 }}>
          <button type="button" className="tour-pasta-close" aria-label="Close ingredients" onClick={closeProfile}><X size={17} /></button>
          <span className="tour-pasta-profile-kicker">FROM OUR MENU</span>
          <h3 id="tour-pasta-profile-title">{selected.name}</h3>
          <span className="tour-pasta-profile-label">Ingredient notes</span>
          {selected.ingredients?.length ? <ul>{selected.ingredients.map(ingredient => <li key={ingredient}>{ingredient}</li>)}</ul> : <p className="tour-pasta-pending">[ADD INGREDIENTS]</p>}
        </motion.aside>}
      </AnimatePresence>
    </div>
    <div className="tour-pasta-footer"><span>THE COFFEE REALM / THE COLLECTION</span><button type="button" onClick={onNext}>Keep exploring <ArrowDown size={16} /></button><span>{number(chapterNumber)} / {number(collectionCount)}</span></div>
  </div>
}
// END PASTA CHAPTER

// BEGIN FLAVOR PLAY — isolated interactive section; no timers or scroll interception.
function FlavorSection({ index, container, reduced, onNext }) {
  const section = useRef(null)
  const inView = useInView(section, { root: container, amount: .2 })
  const { scrollYProgress } = useScroll({ container, target: section, offset: ['start end', 'start start'] })
  const entrance = useSpring(scrollYProgress, { stiffness: 110, damping: 26, mass: .3 })
  const cupScale = useTransform(entrance, [0, .15, .9, 1], [.85, .85, 1, 1])
  const cupOpacity = useTransform(entrance, [0, .12, .7, 1], [0, 0, 1, 1])
  const cupY = useTransform(entrance, [0, 1], [38, 0])
  const watermarkY = useTransform(entrance, [0, 1], [85, 0])
  const revealState = reduced || inView ? 'visible' : 'hidden'
  const copyReveal = {
    hidden: { opacity: 0, y: 18, transition: { duration: .15 } },
    visible: delay => ({ opacity: 1, y: 0, transition: { duration: reduced ? 0 : .45, delay: reduced ? 0 : delay, ease: [.22, 1, .36, 1] } }),
  }
  const bubbleReveal = {
    hidden: { opacity: 0, scale: .78, y: 26, transition: { duration: .18 } },
    visible: order => ({ opacity: 1, scale: 1, y: 0, transition: { duration: reduced ? 0 : .6, delay: reduced ? 0 : .12 + order * .14, ease: [.22, 1, .36, 1] } }),
  }
  const [selected, setSelected] = useState(0)
  const [hasSwitched, setHasSwitched] = useState(false)
  const flavor = flavors[selected]
  const fade = { duration: reduced ? .12 : .32, ease: 'easeInOut' }

  useEffect(() => {
    if (!inView) return
    // Warm the other two cups when this section approaches, so the first tap fades cleanly.
    flavors.forEach(item => { const image = new Image(); image.src = `/images/realm-tour/${item.cup}` })
  }, [inView])

  function chooseFlavor(next) {
    if (next === selected) return
    setHasSwitched(!reduced)
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
            <div className={`tour-flavor-cup ${hasSwitched && !reduced ? 'is-splashing' : ''}`}>
              <img src={`/images/realm-tour/${flavor.cup}`} alt={`${flavor.name} in an iced glass`} width={flavor.width} height={flavor.height} decoding="async" loading="lazy" draggable="false" onAnimationEnd={() => setHasSwitched(false)} />
              {hasSwitched && !reduced && <div className="tour-flavor-splash" aria-hidden="true"><i /><i /><span /><span /><span /><span /></div>}
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
              <img src={`/images/realm-tour/${item.bubble}`} alt="" width="128" height="128" loading="lazy" decoding="async" draggable="false" />
              <span>{item.name}</span>
            </button>
          </div></div>
        </motion.div>)}
      </div>
    </div>
    <div className="tour-flavor-footer">
      <div className="tour-flavor-selected" role="status" aria-live="polite" aria-atomic="true"><span>YOUR CURRENT CRAVING</span><strong>{flavor.name}</strong></div>
      <button type="button" className="tour-flavor-next" onClick={onNext}>Keep exploring <ArrowDown size={17} /></button>
    </div>
  </section>
}
// END FLAVOR PLAY

// BEGIN REALM GALLERY — self-contained; shares only the tour's motion preference.
function RealmGallerySection({ index, container, reduced }) {
  const section = useRef(null)
  const inView = useInView(section, { root: container, amount: .2, once: true })
  const entered = useRef(false)
  const [entranceCount, setEntranceCount] = useState(0)
  const track = useRef(null)
  const drag = useRef(null)
  const positions = useRef([])
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => { if (inView) entered.current = true }, [inView])

  const reveal = delay => ({
    initial: false,
    animate: { opacity: reduced || inView ? 1 : 0, y: reduced || inView ? 0 : 20 },
    transition: { duration: reduced ? 0 : .5, delay: reduced || !inView ? 0 : delay, ease: [.22, 1, .36, 1] },
  })

  useEffect(() => {
    const row = track.current
    let frame = 0
    const update = () => {
      frame = 0
      const nearest = positions.current.reduce((best, left, i, all) =>
        Math.abs(left - row.scrollLeft) < Math.abs(all[best] - row.scrollLeft) ? i : best, 0)
      setActivePhoto(nearest)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const measure = () => {
      const cards = Array.from(row.children)
      positions.current = cards.map(card => card.offsetLeft - cards[0].offsetLeft)
      // Measure the starting viewport, then freeze this set: later photos browse normally.
      if (!entered.current) setEntranceCount(cards.filter(card => card.offsetLeft < row.clientWidth).length)
      onScroll()
    }
    const resize = new ResizeObserver(measure)
    resize.observe(row)
    row.addEventListener('scroll', onScroll, { passive: true })
    measure()
    return () => {
      resize.disconnect()
      row.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  function showPhoto(photoIndex) {
    const next = Math.max(0, Math.min(galleryPhotos.length - 1, photoIndex))
    track.current.scrollTo({ left: positions.current[next], behavior: reduced ? 'instant' : 'smooth' })
  }

  function onKeyDown(event) {
    const destinations = { ArrowLeft: activePhoto - 1, ArrowRight: activePhoto + 1, Home: 0, End: galleryPhotos.length - 1 }
    if (!(event.key in destinations) || event.altKey || event.ctrlKey || event.metaKey) return
    event.preventDefault()
    event.stopPropagation()
    showPhoto(destinations[event.key])
  }

  function startDrag(event) {
    // Touch and trackpad scrolling stay native, including vertical page gestures.
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    const row = event.currentTarget
    drag.current = { id: event.pointerId, x: event.clientX, left: row.scrollLeft }
    row.dataset.dragging = 'true'
    row.setPointerCapture(event.pointerId)
    row.focus({ preventScroll: true })
    event.preventDefault()
  }

  function moveDrag(event) {
    if (drag.current?.id !== event.pointerId) return
    event.currentTarget.scrollLeft = drag.current.left - (event.clientX - drag.current.x)
  }

  function endDrag(event) {
    if (drag.current?.id !== event.pointerId) return
    const row = event.currentTarget
    const left = row.scrollLeft
    drag.current = null
    delete row.dataset.dragging
    if (row.hasPointerCapture(event.pointerId)) row.releasePointerCapture(event.pointerId)
    const nearest = positions.current.reduce((best, position, i, all) =>
      Math.abs(position - left) < Math.abs(all[best] - left) ? i : best, 0)
    showPhoto(nearest)
  }

  return <section ref={section} id="around-the-realm" data-tour-section={index} className="tour-section tour-gallery" aria-labelledby="tour-gallery-heading">
    <div className="tour-gallery-intro">
      <motion.span className="tour-kicker" {...reveal(0)}>THE REALM, A LITTLE CLOSER</motion.span>
      <motion.h2 id="tour-gallery-heading" {...reveal(.07)}>Find a spot.{' '}<br /><em>Stay a little.</em></motion.h2>
      <motion.p {...reveal(.14)}>Soft seats, warm little corners, and room for one more round.</motion.p>
    </div>
    <ol ref={track} id="tour-gallery-photos" className="tour-gallery-track" tabIndex={0}
      aria-label="Around the Realm: 12 cafe photos" aria-describedby="tour-gallery-help"
      onKeyDown={onKeyDown} onPointerDown={startDrag} onPointerMove={moveDrag}
      onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
      {galleryPhotos.map((photo, photoIndex) => <li key={photo.file} className="tour-gallery-card">
        <motion.div className="tour-gallery-deal" initial={false}
          animate={!reduced && !inView && photoIndex < entranceCount ? { opacity: 0, y: 38, rotate: photoIndex % 2 ? 7 : -7, scale: .94 } : { opacity: 1, y: 0, rotate: 0, scale: 1 }}
          transition={{ duration: reduced || photoIndex >= entranceCount ? 0 : .6, delay: !reduced && inView && photoIndex < entranceCount ? .16 + photoIndex * .12 : 0, ease: [.22, 1, .36, 1] }}>
        <figure className="tour-gallery-print">
          <img src={`/images/realm-tour/${photo.file}`} alt={photo.alt} loading="lazy" decoding="async" draggable="false" width="1440" height={photo.file === 'pc1.jpg' ? 960 : ['pc10.jpg', 'pc11.jpg'].includes(photo.file) ? 1721 : 1613} />
          <figcaption><span>{photo.caption}</span><span aria-hidden="true">{number(photoIndex + 1)}</span></figcaption>
        </figure>
        </motion.div>
      </li>)}
    </ol>
    <div className="tour-gallery-footer">
      <p id="tour-gallery-help">Swipe, drag, or use the arrows.<span> A little look around. At your own pace.</span></p>
      <div className="tour-gallery-controls">
        <span className="tour-gallery-count" role="status" aria-live="polite" aria-atomic="true"><span className="tour-gallery-sr-only">Photo </span>{number(activePhoto + 1)} <span>/ {number(galleryPhotos.length)}</span></span>
        <button type="button" aria-label="Previous cafe photo" aria-controls="tour-gallery-photos" disabled={activePhoto === 0} onClick={() => showPhoto(activePhoto - 1)}><ArrowLeft size={18} /></button>
        <button type="button" aria-label="Next cafe photo" aria-controls="tour-gallery-photos" disabled={activePhoto === galleryPhotos.length - 1} onClick={() => showPhoto(activePhoto + 1)}><ArrowRight size={18} /></button>
      </div>
    </div>
  </section>
}
// END REALM GALLERY

function ProductSection({ product, index, sectionIndex, container, reduced, onNext }) {
  const ref = useRef(null)
  const inView = useInView(ref, { root: container, amount: .2 })
  const { scrollYProgress } = useScroll({ container, target: ref, offset: ['start end', 'end start'] })
  const timeline = useSpring(scrollYProgress, { stiffness: 115, damping: 28, mass: .32 })
  // Preserve each existing product's motion direction when a chapter is inserted.
  const direction = (products.findIndex(item => item.id === product.id) + 1) % 2 ? 1 : -1
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
  const watermarkX = useTransform(timeline, [0, 1], [direction * 100, direction * -120])
  const watermarkRotate = useTransform(timeline, [0, 1], [-5, 4])
  const ghostY = useTransform(timeline, [0, .5, 1], [130, 0, -150])
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
        <div className="tour-product-details"><p>{product.price}{product.priceUnit && ` (${product.priceUnit})`} <span aria-hidden="true">/</span> {product.description}</p></div>
        <button onClick={onNext} className="tour-next inline-flex items-center gap-5">{index === collectionCount ? 'Find your corner' : 'Keep exploring'}<ArrowRight size={18} /></button>
      </motion.div>
      <div className={`tour-product-stage tour-shape-${product.shape} relative flex items-center justify-center`}>
        <motion.span className="tour-product-orbit absolute" aria-hidden="true" style={reduced ? undefined : { scale: orbitScale, rotate: orbitRotate, opacity: orbitOpacity }} />
        <motion.span className="tour-ground-shadow absolute" aria-hidden="true" style={reduced ? undefined : { scaleX: shadowScale, opacity: shadowOpacity }} />
        {imageFailed ? <div className="tour-image-fallback" role="img" aria-label={`${product.name} photo unavailable`}>Photo unavailable</div> : <motion.img
          className="tour-cutout relative z-10 h-full w-full object-contain"
          src={product.image} alt={product.name} width="1200" height="1200"
          loading={index === 1 ? 'eager' : 'lazy'} decoding="async" draggable="false"
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
    const reset = () => { tiltX.set(0); tiltY.set(0) }
    const move = event => {
      if (!pointer.matches || event.pointerType !== 'mouse') return
      const bounds = surface.getBoundingClientRect()
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
  const { scrollYProgress } = useScroll({ container, target: ref, offset: ['start end', 'end start'] })
  const timeline = useSpring(scrollYProgress, { stiffness: 95, damping: 30, mass: .35 })
  const backdropScale = useTransform(timeline, [0, .5, 1], [1.08, 1, 1.09])
  const backdropY = useTransform(timeline, [0, 1], [28, -28])
  const contentY = useTransform(timeline, [0, .45, .55, 1], [90, 0, 0, -110])
  const contentScale = useTransform(timeline, [0, .45, .55, 1], [.95, 1, 1, .96])
  const contentOpacity = useTransform(timeline, [0, .16, .82, 1], [0, 1, 1, 0])
  return <section ref={ref} id={index === 0 ? 'welcome' : 'visit'} data-tour-section={index} data-active={inView} className="tour-section tour-environment relative" aria-label={index === 0 ? 'Welcome to The Coffee Realm' : 'See you in the Realm'}>
    <div className="tour-backdrop absolute inset-0 overflow-hidden">
      {index === 0 ? <div className="tour-hero-reveal" data-arrived={arrived} onAnimationEnd={() => setArrived(true)}><motion.div className="tour-hero-tilt" style={reduced ? undefined : { rotateX: tiltX, rotateY: tiltY, transformPerspective: 1200 }}>
        <motion.img src={image} alt="" className="h-full w-full object-cover" loading="eager" fetchPriority="high" decoding="async" style={reduced ? undefined : { scale: backdropScale, y: backdropY }} />
      </motion.div></div> : <motion.img src={image} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" style={reduced ? undefined : { scale: backdropScale, y: backdropY }} />}
    </div>
    <div className="tour-environment-overlay absolute inset-0" />
    <motion.div className="tour-environment-content relative z-10 h-full w-full" style={reduced ? undefined : { y: contentY, scale: contentScale, opacity: contentOpacity }}>{children}</motion.div>
  </section>
}
