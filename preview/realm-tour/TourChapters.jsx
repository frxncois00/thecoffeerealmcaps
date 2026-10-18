// PERF: noncritical interactive chapters are loaded in a separate chunk.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { ArrowLeft, ArrowRight, ChefHat, Coffee, Flame, Leaf, UtensilsCrossed, X } from 'lucide-react'
import { cakeSlices, pastaDishes, galleryPhotos, products } from './products'
import TourImage from './TourImage'
const number = value => String(value).padStart(2, '0')
const collectionCount = products.length + 1

// BEGIN CAKE WHEEL — one snap stop; CSS rotation keeps the nine windows upright.
const cakeGondolas = cakeSlices.map((cake, index) => {
  const angle = (index * 360 / cakeSlices.length - 90) * Math.PI / 180
  return { ...cake, x: 50 + Math.cos(angle) * 50, y: 50 + Math.sin(angle) * 50 }
})

export function CakeWheelSection({ index, container, reduced }) {
  const section = useRef(null)
  const inView = useInView(section, { root: container, amount: .1 })
  const entered = useInView(section, { root: container, amount: .35, once: true })
  const [assembled, setAssembled] = useState(reduced)
  useEffect(() => { if (reduced) setAssembled(true) }, [reduced])

  // A named region preserves the existing product sections' nth-of-type styling.
  return <div ref={section} id="cake-wheel" role="region" aria-labelledby="tour-cake-heading"
     data-in-view={inView} data-entered={entered} data-assembled={assembled}
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
                  <div className="tour-cake-window"><TourImage sizes="(max-width: 640px) 110px, 200px" src={`/images/realm-tour/${cake.file}`} alt={cake.alt} width="1024" height="1024" loading="lazy" decoding="async" draggable="false" /></div>
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
  </div>
}
// END CAKE WHEEL

// BEGIN PASTA CHAPTER — one snap region; no wheel/touch interception or recipe guesses.
const pastaRibbon = 'M-90 85 C60 155 135 190 260 205 S595 210 750 270 S1000 345 900 395 C790 465 635 330 460 400 S155 440 160 505 C165 590 340 540 440 555 S640 625 780 585 S1050 600 1070 675'
const pastaIcons = [UtensilsCrossed, Leaf, Flame, ChefHat]

export function PastaChapterSection({ index, chapterNumber, container, reduced }) {
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
    document.addEventListener('pointerdown', outside, { passive: true })
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
  // Restore the original once-per-visit swirl drawing requested by the user.
  // This deliberate SVG stroke animation is finite; reduced motion shows its final state.
  const draw = { initial: false, animate: { pathLength: reduced || entered ? 1 : 0 }, transition: { duration: reduced ? 0 : 3.6, ease: [.22, 1, .36, 1] } }

  // A div region leaves the neighboring products' section:nth-of-type styling intact.
  return <div ref={section} id="pasta-chapter" role="region" aria-labelledby="tour-pasta-heading"
    className="tour-section tour-pasta"  data-active={inView && !reduced} data-entered={entered || reduced}
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
          {/* Reveal each plate when it reaches the viewport, including lower rows on mobile.
              Opacity leads the motion; no spring, overshoot, or rotation. */}
          <motion.div className="tour-pasta-dish-entry"
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={reduced ? { opacity: 1, y: 0 } : undefined}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ root: container, amount: .2, once: true }}
            transition={{
              opacity: { duration: reduced ? 0 : 1.15, delay: reduced ? 0 : dishIndex * .14, ease: [.4, 0, .2, 1] },
              y: { duration: reduced ? 0 : 1.35, delay: reduced ? 0 : dishIndex * .14, ease: [.22, 1, .36, 1] },
            }}>
            <button ref={element => { dishButtons.current[dish.id] = element }} type="button" className="tour-pasta-dish-button"
              aria-label={`${dish.name} ingredients`} aria-expanded={selectedId === dish.id} aria-controls={selectedId === dish.id ? 'tour-pasta-profile' : undefined}
              onClick={() => setSelectedId(current => current === dish.id ? null : dish.id)}>
              <span className="tour-pasta-plate"><TourImage sizes="(max-width: 640px) 48vw, 28vw" src={`/images/realm-tour/${dish.file}`} alt="" width="1371" height="1148" loading="lazy" decoding="async" draggable="false" /><span className="tour-pasta-badge" aria-hidden="true"><Icon size={19} strokeWidth={1.25} /></span></span>
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
    <div className="tour-pasta-footer"><span>THE COFFEE REALM / THE COLLECTION</span><span>{number(chapterNumber)} / {number(collectionCount)}</span></div>
  </div>
}
// END PASTA CHAPTER

// BEGIN REALM GALLERY — self-contained; shares only the tour's motion preference.
export function RealmGallerySection({ index, container, reduced }) {
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
    let resizeTimer
    const resize = new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(measure, 100) })
    resize.observe(row)
    row.addEventListener('scroll', onScroll, { passive: true })
    measure()
    return () => {
      resize.disconnect()
      clearTimeout(resizeTimer)
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

  return <section ref={section} id="around-the-realm"  className="tour-section tour-gallery" aria-labelledby="tour-gallery-heading">
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
          <TourImage sizes="(max-width: 640px) 78vw, 400px" src={`/images/realm-tour/${photo.file}`} alt={photo.alt} loading="lazy" decoding="async" draggable="false" width="1440" height={photo.file === 'pc1.jpg' ? 960 : ['pc10.jpg', 'pc11.jpg'].includes(photo.file) ? 1721 : 1613} />
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
