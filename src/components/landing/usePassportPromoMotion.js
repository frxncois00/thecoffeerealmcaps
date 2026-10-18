import { useEffect } from 'react'
import { MOTION_ENABLED } from '../../motion/config'

// Each transform lives on its own layer: parallax, entrance, float, then tilt.
// Native media queries avoid an initial server snapshot skipping the entrance.
export default function usePassportPromoMotion(sectionRef) {
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return undefined

    const progress = section.querySelector('.rpp-progress')
    const stage = section.querySelector('.rpp-stage')
    const book = section.querySelector('.rpp-book-tilt')
    const bookTarget = section.querySelector('.rpp-book-position')
    if (!progress || !stage || !book || !bookTarget) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 768px)')
    const parallaxLayers = [...section.querySelectorAll('[data-depth]')]
    let inView = false
    let observer
    let pointerController
    let pointerFrame = 0

    const motionEnabled = () => MOTION_ENABLED && !reducedMotion.matches
    const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value))

    function pauseAmbient() {
      section.classList.toggle('rpp-paused', !inView || document.hidden)
    }

    function resetPointer() {
      cancelAnimationFrame(pointerFrame)
      pointerFrame = 0
      for (const layer of parallaxLayers) {
        layer.style.removeProperty('--px')
        layer.style.removeProperty('--py')
      }
      book.style.removeProperty('--rx')
      book.style.removeProperty('--ry')
      book.classList.remove('is-hovered')
    }

    function resetRuntime() {
      section.classList.remove('rpp-motion', 'rpp-paused', 'rpp-entrance-complete', 'is-revealed')
      progress.classList.remove('is-revealed', 'is-complete')
      resetPointer()
    }

    // Reveal once; keep observing the section only to pause offscreen loops.
    // Completing the static state also prevents replay after preference changes.
    function observe() {
      observer?.disconnect()
      section.classList.toggle('rpp-motion', motionEnabled())
      if (!motionEnabled() || !('IntersectionObserver' in window)) {
        section.classList.add('is-revealed', 'rpp-entrance-complete')
        progress.classList.add('is-revealed', 'is-complete')
        inView = true
        pauseAmbient()
        return
      }

      inView = false
      pauseAmbient()
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.target === section) {
            inView = entry.isIntersecting
            if (inView) section.classList.add('is-revealed')
            pauseAmbient()
          } else if (entry.isIntersecting) {
            progress.classList.add('is-revealed')
            observer.unobserve(progress)
          }
        }
      }, { threshold: 0.08 })
      observer.observe(section)
      if (!progress.classList.contains('is-revealed')) observer.observe(progress)
    }

    function configurePointer() {
      pointerController?.abort()
      resetPointer()
      if (!motionEnabled() || !desktopPointer.matches) return

      pointerController = new AbortController()
      const options = { passive: true, signal: pointerController.signal }
      let pointerX = 0
      let pointerY = 0
      stage.addEventListener('pointermove', event => {
        if (event.pointerType === 'touch' || document.hidden) return
        pointerX = event.clientX
        pointerY = event.clientY
        if (pointerFrame) return
        pointerFrame = requestAnimationFrame(() => {
          pointerFrame = 0
          // Read layout before writing transform variables; at most once per frame.
          const rect = stage.getBoundingClientRect()
          const bookRect = bookTarget.getBoundingClientRect()
          if (!rect.width || !rect.height || !bookRect.width || !bookRect.height) return
          const x = clamp((pointerX - rect.left - rect.width / 2) / (rect.width / 2), 1)
          const y = clamp((pointerY - rect.top - rect.height / 2) / (rect.height / 2), 1)
          const hoveringBook = bookTarget.contains(document.elementFromPoint(pointerX, pointerY))
          const rx = clamp(-(pointerY - bookRect.top - bookRect.height / 2) / (bookRect.height / 2) * 8, 8)
          const ry = clamp((pointerX - bookRect.left - bookRect.width / 2) / (bookRect.width / 2) * 8, 8)

          for (const layer of parallaxLayers) {
            const depth = Number(layer.dataset.depth)
            layer.style.setProperty('--px', `${(x * depth * 15).toFixed(2)}px`)
            layer.style.setProperty('--py', `${(y * depth * 15).toFixed(2)}px`)
          }
          book.classList.toggle('is-hovered', hoveringBook)
          book.style.setProperty('--rx', `${hoveringBook ? rx.toFixed(2) : 0}deg`)
          book.style.setProperty('--ry', `${hoveringBook ? ry.toFixed(2) : 0}deg`)
        })
      }, options)
      stage.addEventListener('pointerleave', resetPointer, options)
      window.addEventListener('blur', resetPointer, options)
    }

    function finishEntrance(event) {
      if (event.animationName === 'rpp-note-in') section.classList.add('rpp-entrance-complete')
      if (event.animationName === 'rpp-check') progress.classList.add('is-complete')
    }

    function updateMotionPreference() {
      observe()
      configurePointer()
    }

    function updateVisibility() {
      pauseAmbient()
      if (document.hidden) resetPointer()
    }

    // Reset imperatively owned state so React StrictMode's effect replay is clean.
    resetRuntime()
    section.addEventListener('animationend', finishEntrance)
    reducedMotion.addEventListener('change', updateMotionPreference)
    desktopPointer.addEventListener('change', configurePointer)
    document.addEventListener('visibilitychange', updateVisibility)
    observe()
    configurePointer()

    return () => {
      observer?.disconnect()
      pointerController?.abort()
      section.removeEventListener('animationend', finishEntrance)
      reducedMotion.removeEventListener('change', updateMotionPreference)
      desktopPointer.removeEventListener('change', configurePointer)
      document.removeEventListener('visibilitychange', updateVisibility)
      resetRuntime()
    }
  }, [sectionRef])
}
