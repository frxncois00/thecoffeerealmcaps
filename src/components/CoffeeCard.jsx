import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { motionTokens } from '../motion/config'
import { menuStartingPrice } from '../utils/menuFilters'
import { money } from '../utils/money'

export default function CoffeeCard({ id, item, index, count, offset, isActive, revealed, enabled, ambient, compact, onSelect, onChoose }) {
  const safeOffset = Number.isFinite(offset) ? offset : 0
  const distance = Math.abs(safeOffset)
  const cardScale = 1
  const cardOpacity = isActive ? 1 : distance === 1 ? 0.62 : distance === 2 ? 0.28 : 0
  const boundsRef = useRef(null)
  const previousOffset = useRef(safeOffset)
  const tiltX = useMotionValue(0)
  const tiltY = useMotionValue(0)
  const rotateX = useSpring(tiltX, { stiffness: 180, damping: 26 })
  const rotateY = useSpring(tiltY, { stiffness: 180, damping: 26 })
  const isWrapping = Math.abs(previousOffset.current - safeOffset) > 1
  const movementDuration = enabled && !isWrapping ? motionTokens.duration.base : 0
  const startingPrice = menuStartingPrice(item)

  useEffect(() => { previousOffset.current = safeOffset }, [safeOffset])

  useEffect(() => {
    if (!ambient || !isActive) {
      tiltX.set(0)
      tiltY.set(0)
    }
  }, [ambient, isActive, tiltX, tiltY])

  const resetTilt = () => {
    tiltX.set(0)
    tiltY.set(0)
  }

  return (
    <motion.article
      id={id}
      className={`coffee-card${isActive ? ' coffee-card-active' : ''}`}
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${count}`}
      aria-hidden={!isActive}
      style={{ zIndex: 10 - distance, pointerEvents: distance > 2 ? 'none' : 'auto', rotateX: ambient ? rotateX : 0, rotateY: ambient ? rotateY : 0, transformPerspective: 1000 }}
      initial={false}
      animate={{
        x: `${safeOffset * (compact ? 76 : 78)}%`,
        scale: cardScale,
        opacity: revealed && distance <= 2 ? 1 : 0,
        y: (isActive ? -10 : distance === 1 ? 0 : 18) + (revealed || !enabled ? 0 : 18),
      }}
      transition={{
        ease: motionTokens.ease,
        duration: enabled ? motionTokens.duration.base : 0.15,
        x: { duration: movementDuration, ease: motionTokens.ease },
        y: { duration: movementDuration, ease: motionTokens.ease },
        scale: { duration: movementDuration, ease: motionTokens.ease },
      }}
      onPointerEnter={(event) => {
        if (ambient && isActive && event.pointerType === 'mouse') boundsRef.current = event.currentTarget.getBoundingClientRect()
      }}
      onPointerMove={(event) => {
        if (!ambient || !isActive || event.pointerType !== 'mouse' || !boundsRef.current) return
        const bounds = boundsRef.current
        tiltX.set((0.5 - (event.clientY - bounds.top) / bounds.height) * 5)
        tiltY.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 5)
      }}
      onPointerLeave={resetTilt}
      whileHover={ambient && isActive ? { y: -15 } : undefined}
      whileTap={enabled && isActive ? { scale: cardScale * 0.985 } : undefined}
    >
      <div className="coffee-card-image">
        <img
          src={item.image || '/images/coffeerealmlogo.png'}
          alt={item.name}
          draggable={false}
          loading={distance <= 1 ? 'eager' : 'lazy'}
          fetchPriority={isActive ? 'high' : 'auto'}
          decoding="async"
          width="680"
          height="520"
          onError={(event) => {
            if (!event.currentTarget.src.endsWith('/images/coffeerealmlogo.png')) event.currentTarget.src = '/images/coffeerealmlogo.png'
          }}
        />
        <span>{item.category}</span>
      </div>
      <div className="coffee-card-body">
        <h3>{item.name}</h3>
        {item.description && <p>{item.description}</p>}
        {Number.isFinite(startingPrice) && <strong className="coffee-card-price">
          {item.variations?.length ? 'From ' : ''}{money(startingPrice)}
        </strong>}
      </div>
      <motion.div className="coffee-card-shade" aria-hidden="true"
        initial={false} animate={{ opacity: 1 - cardOpacity }}
        transition={{ duration: enabled ? motionTokens.duration.base : 0.15 }} />
      <button className="coffee-card-action" type="button" tabIndex={isActive && item.available ? 0 : -1}
        disabled={isActive && !item.available}
        aria-label={isActive && !item.available ? `${item.name} unavailable` : `${isActive ? 'View' : 'Show'} ${item.name}`}
        onClick={() => {
          if (isActive) onChoose?.(item)
          else onSelect(safeOffset)
        }} />
    </motion.article>
  )
}
