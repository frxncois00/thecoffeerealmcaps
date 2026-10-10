import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { useRealmMotion } from '../../motion/useRealmMotion'
import { motionTokens } from '../../motion/config'

export function LandingControls() {
  const { enabled } = useRealmMotion()
  const { scrollYProgress } = useScroll()
  useEffect(() => {
    const root = document.documentElement
    root.dataset.realmMotion = enabled ? 'full' : 'reduced'
    root.style.setProperty('--realm-ease', `cubic-bezier(${motionTokens.ease.join(',')})`)
    root.style.setProperty('--realm-duration-fast', `${motionTokens.duration.fast}s`)
    root.style.setProperty('--realm-duration-base', `${motionTokens.duration.base}s`)
    return () => { delete root.dataset.realmMotion }
  }, [enabled])
  return enabled ? <motion.div className="realm-scroll-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" /> : null
}

export function HeroAtmosphere({ heroRef }) {
  const { ambient } = useRealmMotion()
  const visible = useInView(heroRef)
  return <>
    {ambient && visible && <div className="realm-steam" aria-hidden="true"><i /><i /><i /></div>}
    <a className="realm-scroll-cue" href="#menu" aria-label="Explore our bestsellers"><span /><ArrowDown size={16} /></a>
  </>
}

export function RealmMarquee() {
  const ref = useRef(null)
  const inView = useInView(ref)
  const { enabled } = useRealmMotion()
  return <section ref={ref} className="marquee realm-marquee" aria-label="The Coffee Realm highlights">
    <div className="realm-marquee-track" style={{ animationPlayState: enabled && inView ? 'running' : 'paused' }}>
      {[0, 1].map(copy => <div className="realm-marquee-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
        {['Homemade cakes', 'Fresh cookie boxes', 'Coffee-based drinks', 'North Fairview cafe'].map(label => <span key={label}>{label}<i aria-hidden="true">✦</i></span>)}
      </div>)}
    </div>
  </section>
}

export function StoryImage() {
  const ref = useRef(null)
  const { ambient } = useRealmMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [-18, 18])
  return <div ref={ref} className="realm-story-image">
    <motion.img src="/images/about-origin.jpg" alt="Warm home interior where The Coffee Realm began" loading="lazy" decoding="async" style={{ y: ambient ? y : 0, scale: ambient ? 1.08 : 1 }} />
  </div>
}

export function JourneyTimeline({ children }) {
  const ref = useRef(null)
  const { enabled } = useRealmMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 78%', 'end 65%'] })
  return <div ref={ref} className="realm-timeline-wrap">
    <motion.span className="realm-timeline-ink" aria-hidden="true" style={{ scaleY: enabled ? scrollYProgress : 1 }} />
    <ol className="landing-about-timeline">{children}</ol>
  </div>
}

export function OpenStatus() {
  const [hour, setHour] = useState(() => getHour())
  useEffect(() => {
    const timer = window.setInterval(() => setHour(getHour()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  const open = hour >= 10
  return <span className={`realm-open-status ${open ? 'is-open' : ''}`} title="Based on our regular hours in Asia/Manila">
    <i aria-hidden="true" />{open ? 'Open now · until midnight' : 'Opens at 10:00 AM'}
  </span>
}

function getHour() {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Manila', hour: '2-digit', hourCycle: 'h23' }).format(new Date()))
}
