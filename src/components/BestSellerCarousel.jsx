import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CoffeeCard from './CoffeeCard'
import { useRealmMotion } from '../motion/useRealmMotion'
import { motionTokens } from '../motion/config'
import './coffee-carousel-motion.css'

const SWIPE_THRESHOLD = 46

export default function BestSellerCarousel({ items = [], onChoose }) {
  if (!items?.length) return null
  return <CarouselBody items={items} onChoose={onChoose} />
}

function CarouselBody({ items, onChoose }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const carouselRef = useRef(null)
  const dotRefs = useRef([])
  const suppressClickRef = useRef(false)
  const wheelTimeRef = useRef(0)
  const carouselId = useId()
  const { enabled, ambient, compact } = useRealmMotion()
  const hasEntered = useInView(carouselRef, { once: true, amount: 0.16 })
  const itemCount = items?.length || 0
  const safeActiveIndex = Number.isFinite(activeIndex) && activeIndex >= 0 && activeIndex < itemCount ? activeIndex : 0

  const goTo = useCallback((index) => {
    if (!itemCount) return
    setActiveIndex(((index % itemCount) + itemCount) % itemCount)
  }, [itemCount])

  const goNext = useCallback(() => goTo(safeActiveIndex + 1), [safeActiveIndex, goTo])
  const goPrev = useCallback(() => goTo(safeActiveIndex - 1), [safeActiveIndex, goTo])

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel || itemCount < 2) return undefined
    const onWheel = (event) => {
      // Preserve vertical page scrolling; only deliberate horizontal gestures browse slides.
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 10) return
      event.preventDefault()
      if (Date.now() - wheelTimeRef.current < 500) return
      wheelTimeRef.current = Date.now()
      if (event.deltaX > 0) goNext()
      else goPrev()
    }
    carousel.addEventListener('wheel', onWheel, { passive: false })
    return () => carousel.removeEventListener('wheel', onWheel)
  }, [goNext, goPrev, itemCount])

  const handleKeyDown = (event) => {
    let nextIndex
    if (event.key === 'ArrowRight') nextIndex = safeActiveIndex + 1
    else if (event.key === 'ArrowLeft') nextIndex = safeActiveIndex - 1
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = itemCount - 1
    else return
    event.preventDefault()
    goTo(nextIndex)
    const wrappedIndex = ((nextIndex % itemCount) + itemCount) % itemCount
    // Keep keyboard focus on the selected picker, never on a newly hidden slide.
    if (event.target.closest('.coffee-carousel-dots, .coffee-card')) dotRefs.current[wrappedIndex]?.focus()
  }

  const handleDragEnd = (_event, info) => {
    setIsDragging(false)
    let nextIndex = safeActiveIndex
    if (info.offset.x < -SWIPE_THRESHOLD || (info.offset.x < -12 && info.velocity.x < -450)) nextIndex += 1
    else if (info.offset.x > SWIPE_THRESHOLD || (info.offset.x > 12 && info.velocity.x > 450)) nextIndex -= 1
    if (nextIndex === safeActiveIndex) return
    goTo(nextIndex)
    if (carouselRef.current?.contains(document.activeElement) && document.activeElement.closest('.coffee-card')) {
      dotRefs.current[((nextIndex % itemCount) + itemCount) % itemCount]?.focus({ preventScroll: true })
    }
  }

  if (!itemCount) return null

  return (
    <div
      ref={carouselRef}
      className="coffee-carousel coffee-carousel-polished"
      data-motion={enabled ? 'on' : 'off'}
      onKeyDown={handleKeyDown}
      role="region"
      aria-roledescription="carousel"
      aria-label="Best seller coffee and treats"
    >
      <button type="button" className="coffee-carousel-nav coffee-carousel-nav-prev" onClick={goPrev}
        aria-label="Show previous coffee" aria-controls={`${carouselId}-slides`} disabled={itemCount < 2}>
        <ChevronLeft size={21} aria-hidden="true" />
      </button>

      <div className="coffee-carousel-window">
        <motion.div
          id={`${carouselId}-slides`}
          className="coffee-carousel-track"
          drag={itemCount > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={enabled ? 0.18 : 0}
          dragMomentum={false}
          dragSnapToOrigin
          dragTransition={{ bounceStiffness: 320, bounceDamping: 32 }}
          onPointerDownCapture={() => { suppressClickRef.current = false }}
          onDragStart={() => {
            suppressClickRef.current = true
            setIsDragging(true)
          }}
          onDragEnd={handleDragEnd}
          onPointerCancel={() => setIsDragging(false)}
          onClickCapture={(event) => {
            if (!suppressClickRef.current) return
            event.preventDefault()
            event.stopPropagation()
            suppressClickRef.current = false
          }}
        >
          {items.map((item, index) => {
            let offset = index - safeActiveIndex
            if (offset > itemCount / 2) offset -= itemCount
            if (offset < -itemCount / 2) offset += itemCount
            return (
              <CoffeeCard
                key={item.id ?? index}
                id={`${carouselId}-slide-${index}`}
                item={item}
                index={index}
                count={itemCount}
                offset={offset}
                isActive={offset === 0}
                revealed={hasEntered || !enabled}
                enabled={enabled}
                ambient={ambient && !isDragging}
                compact={compact}
                onSelect={(cardOffset) => goTo(safeActiveIndex + cardOffset)}
                onChoose={onChoose}
              />
            )
          })}
        </motion.div>
      </div>

      <button type="button" className="coffee-carousel-nav coffee-carousel-nav-next" onClick={goNext}
        aria-label="Show next coffee" aria-controls={`${carouselId}-slides`} disabled={itemCount < 2}>
        <ChevronRight size={21} aria-hidden="true" />
      </button>

      <div className="coffee-carousel-controls">
        <div className="coffee-carousel-dots" role="group" aria-label="Select a best seller">
          {items.map((item, index) => (
            <button
              key={item.id ?? index}
              ref={(element) => { dotRefs.current[index] = element }}
              type="button"
              aria-current={index === safeActiveIndex ? 'true' : undefined}
              aria-controls={`${carouselId}-slide-${index}`}
              aria-label={`Show ${item.name}, ${index + 1} of ${itemCount}`}
              tabIndex={index === safeActiveIndex ? 0 : -1}
              className={index === safeActiveIndex ? 'active' : ''}
              onClick={() => goTo(index)}
            >
              <motion.span aria-hidden="true"
                animate={{ scaleX: index === safeActiveIndex ? 2.6 : 1, opacity: index === safeActiveIndex ? 1 : 0.3 }}
                transition={{ duration: enabled ? motionTokens.duration.base : 0, ease: motionTokens.ease }} />
            </button>
          ))}
        </div>
        <span className="coffee-carousel-count" aria-hidden="true">
          {String(safeActiveIndex + 1).padStart(2, '0')} <span>/ {String(itemCount).padStart(2, '0')}</span>
        </span>
      </div>
      <p className="coffee-carousel-announcement" aria-live="polite" aria-atomic="true">
        {items[safeActiveIndex].name}, {safeActiveIndex + 1} of {itemCount}
      </p>
    </div>
  )
}
