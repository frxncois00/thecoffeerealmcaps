import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { useRealmMotion } from '../../motion/useRealmMotion'

const CLIPS = ['/assets/vids/part0.mp4', '/assets/vids/part1.mp4', '/assets/vids/part2.mp4']
const CROSSFADE = 900

export default function HeroMedia({ heroRef }) {
  const { enabled, ambient, compact } = useRealmMotion()
  const visible = useInView(heroRef, { amount: 0.05 })
  const [pageVisible, setPageVisible] = useState(!document.hidden)
  const [sources, setSources] = useState([0, 1])
  const [active, setActive] = useState(0)
  const [started, setStarted] = useState(false)
  const videos = useRef([])
  const switching = useRef(false)
  const timer = useRef(null)
  const allowed = useRef(false)
  allowed.current = enabled && visible && pageVisible
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 85])

  useEffect(() => {
    const change = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', change)
    return () => document.removeEventListener('visibilitychange', change)
  }, [])

  useEffect(() => {
    const media = videos.current
    media.forEach((video, index) => {
      if (!video) return
      if (enabled && visible && pageVisible && index === active) video.play().catch(() => {})
      else video.pause()
    })
    return () => media.forEach(video => video?.pause())
  }, [enabled, visible, pageVisible, active, sources])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const advance = useCallback(async () => {
    if (!allowed.current || switching.current) return
    const outgoing = active
    const incoming = 1 - active
    const next = videos.current[incoming]
    if (!next) return
    switching.current = true
    next.currentTime = 0
    try {
      await next.play()
      if (!allowed.current) { next.pause(); switching.current = false; return }
      setActive(incoming)
      timer.current = window.setTimeout(() => {
        videos.current[outgoing]?.pause()
        setSources(current => {
          const updated = [...current]
          updated[outgoing] = (current[incoming] + 1) % CLIPS.length
          return updated
        })
        switching.current = false
      }, CROSSFADE)
    } catch { switching.current = false }
  }, [active])

  return <motion.div className="landing-hero-media" aria-hidden="true" style={{ y: ambient ? y : 0 }}>
    <img className="realm-hero-poster" src="/assets/img/espresso.webp" alt="" fetchPriority="high" />
    {sources.map((clip, index) => <video
      key={index}
      ref={element => { videos.current[index] = element }}
      className={`landing-hero-video ${active === index && started ? 'is-active' : ''}`}
      src={started || (enabled && visible) ? CLIPS[clip] : undefined}
      muted playsInline preload={index === active ? 'metadata' : 'none'}
      onPlaying={() => setStarted(true)}
      onTimeUpdate={event => {
        const video = event.currentTarget
        if (!compact && index === active && video.duration - video.currentTime < 0.9) advance()
      }}
      onEnded={() => { if (index === active) advance() }}
    />)}
  </motion.div>
}
