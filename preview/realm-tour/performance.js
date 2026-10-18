import { createContext, useContext, useEffect, useState } from 'react'
import { scroll, useInView, useMotionValue } from 'framer-motion'
import { createFrameBudget } from './frameBudget.js'

// PERF: capability hints are optional; unknown mobile devices start conservatively.
export function initialQuality({ cores, memory, mobile }) {
  if ((cores && cores <= 2) || (memory && memory <= 2)) return 'low'
  return mobile || (cores && cores <= 4) || (memory && memory <= 4) ? 'medium' : 'high'
}
export const lowerQuality = tier => tier === 'high' ? 'medium' : 'low'
export const RenderContext = createContext({ tier: 'medium', hidden: false })

export function useRenderBudget(container) {
  const [tier, setTier] = useState(() => initialQuality({ cores: navigator.hardwareConcurrency, memory: navigator.deviceMemory, mobile: matchMedia('(pointer: coarse)').matches }))
  const [hidden, setHidden] = useState(document.hidden)
  useEffect(() => {
    let frame = 0
    const monitor = createFrameBudget(() => setTier(lowerQuality))
    // PERF: one small sampling loop; React only updates when a tier changes.
    // Two consecutive 2s windows below 45fps avoid reacting to a single image decode.
    const sample = now => {
      monitor.sample(now)
      frame = requestAnimationFrame(sample)
    }
    const visibility = () => {
      setHidden(document.hidden)
      cancelAnimationFrame(frame)
      monitor.reset()
      if (!document.hidden) frame = requestAnimationFrame(sample)
    }
    visibility()
    document.addEventListener('visibilitychange', visibility)
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', visibility) }
  }, [])

  useEffect(() => {
    const root = container.current
    let timer
    // PERF: no measurements in this passive listener. Promote only the visible
    // hero/cutout while scrolling, releasing layers after its spring settles.
    const moving = () => {
      root.dataset.scrolling = 'true'
      clearTimeout(timer)
      timer = setTimeout(() => { delete root.dataset.scrolling }, 600)
    }
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) entry.target.dataset.renderVisible = String(entry.isIntersecting)
    }, { root, threshold: 0 })
    root.querySelectorAll('[data-tour-section]').forEach(node => observer.observe(node))
    root.addEventListener('scroll', moving, { passive: true })
    return () => { observer.disconnect(); clearTimeout(timer); root.removeEventListener('scroll', moving); delete root.dataset.scrolling }
  }, [container])
  return { tier, hidden }
}

// PERF: unsubscribe the entire scroll driver off-screen, rather than continuing
// to update dozens of hidden transforms. Motion keeps its previous pose on exit.
export function useVisibleScroll({ container, target, offset, reduced }) {
  const { hidden } = useContext(RenderContext)
  const visible = useInView(target, { root: container, amount: 'some' })
  const scrollYProgress = useMotionValue(0)
  const start = offset[0], end = offset[1]
  useEffect(() => {
    if (!visible || hidden || reduced) return
    return scroll(value => scrollYProgress.set(value), {
      container: container.current, target: target.current, offset: [start, end],
    })
  }, [container, target, visible, hidden, reduced, start, end, scrollYProgress])
  return { scrollYProgress }
}
