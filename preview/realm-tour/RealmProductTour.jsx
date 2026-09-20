import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowDown, ArrowLeft, ArrowRight, Coffee, MapPin, Pause, Play } from 'lucide-react'
import { environment, products } from './products'

const chapters = ['Welcome', ...products.map(product => product.name), 'See you soon']
const number = value => String(value).padStart(2, '0')

export default function RealmProductTour() {
  const container = useRef(null)
  const systemReduced = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const reduced = Boolean(systemReduced || paused)
  const [active, setActive] = useState(0)
  const [notice, setNotice] = useState('')
  const { scrollYProgress } = useScroll({ container })

  useEffect(() => {
    const root = container.current
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting && entry.intersectionRatio >= .5)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActive(Number(visible.target.dataset.tourSection))
    }, { root, threshold: [.25, .5, .65] })
    root.querySelectorAll('[data-tour-section]').forEach(section => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  function goTo(index) {
    const target = container.current?.querySelector(`[data-tour-section="${index}"]`)
    target?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' })
  }

  function placeholderAction(action) {
    // TODO: supply the approved menu URL and location URL before publishing.
    // These intentionally do not guess or navigate to production routes.
    setNotice(`${action}: preview only. Destination has not been configured yet.`)
  }

  return <div className={`realm-product-tour ${reduced ? 'is-reduced' : ''}`}>
    <header className="tour-hud fixed inset-x-0 top-0 z-50 grid items-center px-5 md:px-10">
      <a className="tour-exit inline-flex items-center gap-2 justify-self-start" href="/"><ArrowLeft size={16} /><span>Exit Tour</span></a>
      <a href="#welcome" onClick={event => { event.preventDefault(); goTo(0) }} className="tour-wordmark justify-self-center">The Coffee Realm<span>THE REALM TOUR</span></a>
      <div className="tour-hud-right flex items-center justify-end gap-4">
        <button className="tour-motion inline-flex items-center justify-center" onClick={() => setPaused(value => !value)} disabled={Boolean(systemReduced)} aria-pressed={reduced} aria-label={systemReduced ? 'Reduced motion enabled by your device' : paused ? 'Resume animations' : 'Pause animations'} title={reduced ? 'Motion reduced' : 'Pause animations'}>{reduced ? <Play size={15} /> : <Pause size={15} />}</button>
        <div className="tour-counter"><span>{active === 0 ? 'WELCOME' : active === 9 ? 'UNTIL NEXT TIME' : `${number(active)} / 08`}</span><b>{chapters[active]}</b></div>
      </div>
      <motion.div aria-hidden="true" className="tour-progress absolute bottom-0 left-0 h-px w-full origin-left" style={{ scaleX: scrollYProgress }} />
    </header>

    <nav className="tour-rail fixed z-40" aria-label="Tour sections">
      {chapters.map((chapter, index) => <button key={chapter} onClick={() => goTo(index)} aria-label={`Go to ${chapter}`} aria-current={active === index ? 'step' : undefined}><span className="tour-rail-label">{chapter}</span><i /></button>)}
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

      {products.map((product, index) => <ProductSection key={product.id} product={product} index={index + 1} container={container} reduced={reduced} onNext={() => goTo(index + 2)} />)}

      <EnvironmentSection container={container} index={9} image={environment.closing} reduced={reduced}>
        <div className="tour-closing-copy relative z-10 mx-auto flex h-full max-w-4xl flex-col items-center justify-center text-center">
          <Coffee size={30} strokeWidth={1.3} className="mb-6" />
          <span className="tour-kicker">SAME PLACE. A NEW LITTLE MOMENT.</span>
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

function ProductSection({ product, index, container, reduced, onNext }) {
  const ref = useRef(null)
  const inView = useInView(ref, { root: container, amount: .2 })
  const { scrollYProgress } = useScroll({ container, target: ref, offset: ['start end', 'end start'] })
  const timeline = useSpring(scrollYProgress, { stiffness: 115, damping: 28, mass: .32 })
  const direction = index % 2 ? 1 : -1
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
  return <section ref={ref} id={product.id} data-tour-section={index} data-active={inView} className={`tour-section tour-product tour-theme-${product.theme} relative`} aria-labelledby={`${product.id}-heading`}>
    <div className="tour-product-grain absolute inset-0" aria-hidden="true" />
    <motion.span className="tour-ghost-index absolute" aria-hidden="true" style={reduced ? undefined : { y: ghostY }}>{number(index)}</motion.span>
    {product.word && <motion.span className="tour-watermark absolute" aria-hidden="true" style={reduced ? undefined : { x: watermarkX, rotate: watermarkRotate }}>{product.word}</motion.span>}
    <motion.span className="tour-scroll-stroke absolute" aria-hidden="true" style={reduced ? undefined : { scaleX: strokeScale }} />
    <div className="tour-product-layout relative z-10 grid h-full items-center">
      <motion.div className="tour-product-copy" style={reduced ? undefined : { x: copyX, y: copyY, opacity: copyOpacity, scale: copyScale }}>
        <span className="tour-kicker flex items-center gap-3"><span className="tour-tiny-line" /> {product.category.toUpperCase()} / {number(index)}</span>
        <h2 id={`${product.id}-heading`}>{product.name}</h2>
        <div className="tour-placeholder"><span className="tour-placeholder-label">COPY & PRICE PLACEHOLDERS</span><p>{product.price} <span aria-hidden="true">/</span> {product.description}</p></div>
        <button onClick={onNext} className="tour-next inline-flex items-center gap-5">{index === 8 ? 'Find your corner' : 'Keep exploring'}<ArrowRight size={18} /></button>
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
    <div className="tour-product-footer absolute inset-x-0 bottom-0 flex justify-between"><span>THE COFFEE REALM / THE COLLECTION</span><span>{number(index)} <span className="opacity-50">/ 08</span></span></div>
  </section>
}

function EnvironmentSection({ index, image, container, reduced, children }) {
  const ref = useRef(null)
  const inView = useInView(ref, { root: container, amount: .15 })
  const { scrollYProgress } = useScroll({ container, target: ref, offset: ['start end', 'end start'] })
  const timeline = useSpring(scrollYProgress, { stiffness: 95, damping: 30, mass: .35 })
  const backdropScale = useTransform(timeline, [0, .5, 1], [1.08, 1, 1.09])
  const backdropY = useTransform(timeline, [0, 1], [28, -28])
  const contentY = useTransform(timeline, [0, .45, .55, 1], [90, 0, 0, -110])
  const contentScale = useTransform(timeline, [0, .45, .55, 1], [.95, 1, 1, .96])
  const contentOpacity = useTransform(timeline, [0, .16, .82, 1], [0, 1, 1, 0])
  return <section ref={ref} id={index === 0 ? 'welcome' : 'visit'} data-tour-section={index} data-active={inView} className="tour-section tour-environment relative" aria-label={index === 0 ? 'Welcome to The Coffee Realm' : 'See you in the Realm'}>
    <div className="tour-backdrop absolute inset-0 overflow-hidden"><motion.img src={image} alt="" className="h-full w-full object-cover" loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} decoding="async" style={reduced ? undefined : { scale: backdropScale, y: backdropY }} /></div>
    <div className="tour-environment-overlay absolute inset-0" />
    <motion.div className="tour-environment-content relative z-10 h-full w-full" style={reduced ? undefined : { y: contentY, scale: contentScale, opacity: contentOpacity }}>{children}</motion.div>
  </section>
}
