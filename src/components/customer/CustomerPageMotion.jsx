import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const TARGETS = [
  '.customer-main > section', '.customer-main > article',
  '.customer-main .checkout-section', '.customer-main .account-card',
  '.customer-main .faq-group', '.customer-main .customer-product',
  '.legal-page > section', '.legal-page > article', '.legal-sections > section',
  '.landing-page > section', '.landing-page > article',
  '.legacy-customer-auth-page .legacy-auth-container',
  '.onboarding-page > section',
].join(',')

export default function CustomerPageMotion() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const publicPath = /^(\/$|\/menu(?:\/|$)|\/about$|\/contact$|\/privacy-policy$|\/terms-of-use$|\/help$|\/checkout(?:\/|$)|\/orders(?:\/|$)|\/profile(?:\/|$)|\/realm-passport$|\/complete-profile$|\/login$|\/register$)/.test(pathname)
    if (!publicPath) return undefined

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('customer-motion-visible')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.06, rootMargin: '0px 0px 35px 0px' })
    const seen = new WeakSet()
    const scan = () => document.querySelectorAll(TARGETS).forEach((element) => {
      if (seen.has(element)) return
      seen.add(element)
      element.classList.add('customer-motion-target')
      observer.observe(element)
    })
    const frame = requestAnimationFrame(scan)
    const mutations = new MutationObserver(scan)
    mutations.observe(document.getElementById('root'), { childList: true, subtree: true })
    return () => {
      cancelAnimationFrame(frame)
      mutations.disconnect()
      observer.disconnect()
    }
  }, [pathname])

  return null
}
