import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { filterMenu, selectBestsellers } from '../../utils/menuFilters'
import './menu-browser.css'

const categoryOrder = ['tcr specials', 'espresso', 'non-coffee', 'cakes', 'sandwich', 'breads', 'cookies', 'meals', 'pasta']
const categoryRank = name => {
  const normalized = name.trim().toLowerCase().replace(/^sandwiches$/, 'sandwich')
  const index = categoryOrder.indexOf(normalized)
  return index === -1 ? categoryOrder.length : index
}

export default function MenuBrowser({ products, loading, error, renderProduct }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Best Sellers')
  const browser = useRef(null)
  const filtered = filterMenu(products, { query })
  const categories = [...new Set(products.map(product => product.category))].sort((a, b) => categoryRank(a) - categoryRank(b))
  const bestsellers = selectBestsellers(filtered)
  const groups = [
    { name: 'Best Sellers', products: bestsellers },
    ...categories.map(name => ({ name, products: filtered.filter(product => product.category === name) })).filter(group => group.products.length),
  ]
  const groupKey = groups.map(group => group.name).join('|')
  const sectionId = name => 'menu-group-' + encodeURIComponent(name)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const sections = [...(browser.current?.querySelectorAll('[data-menu-category]') || [])]
      const offset = (browser.current?.querySelector('.menu-category-strip')?.getBoundingClientRect().bottom || 140) + 24
      let current = sections[0]
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= offset) current = section
      }
      if (current) setActiveCategory(current.dataset.menuCategory)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame) }
  }, [groupKey])
  const goToCategory = name => {
    setActiveCategory(name)
    document.getElementById(sectionId(name))?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
  }
  useEffect(() => {
    const strip = browser.current?.querySelector('.menu-category-strip')
    let frame = 0
    const centerSelected = () => {
      if (!strip) return
      cancelAnimationFrame(frame)
      const buttons = strip.querySelectorAll('button')
      if (!buttons.length) return
      strip.style.paddingLeft = '0px'
      strip.style.paddingRight = Math.max(0, (strip.clientWidth - buttons[buttons.length - 1].offsetWidth) / 2) + 'px'
      const selected = strip.querySelector('[aria-current="location"]')
      if (!selected) return
      const index = Array.from(buttons).indexOf(selected)
      const target = index < 2 ? 0 : Math.max(0, selected.offsetLeft - (strip.clientWidth - selected.offsetWidth) / 2)
      const start = strip.scrollLeft
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        strip.scrollLeft = target
        return
      }
      const startedAt = performance.now()
      const animate = now => {
        const progress = Math.min(1, (now - startedAt) / 650)
        const eased = (1 - Math.cos(Math.PI * progress)) / 2
        strip.scrollLeft = start + (target - start) * eased
        if (progress < 1) frame = requestAnimationFrame(animate)
      }
      frame = requestAnimationFrame(animate)
    }
    const stopAnimation = () => cancelAnimationFrame(frame)
    centerSelected()
    strip?.addEventListener('pointerdown', stopAnimation, { passive: true })
    strip?.addEventListener('wheel', stopAnimation, { passive: true })
    window.addEventListener('resize', centerSelected)
    return () => {
      cancelAnimationFrame(frame)
      strip?.removeEventListener('pointerdown', stopAnimation)
      strip?.removeEventListener('wheel', stopAnimation)
      window.removeEventListener('resize', centerSelected)
    }
  }, [activeCategory, groupKey])
  const reset = () => setQuery('')
  return <div className="menu-browser" ref={browser}>
    <div className="menu-search-box">
      <Search size={20} aria-hidden="true" />
      <label className="sr-only" htmlFor="menu-search">Search menu</label>
      <input id="menu-search" type="search" value={query} maxLength={100} onChange={event => setQuery(event.target.value)} placeholder="Search coffee, meals, desserts…" />
      {query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={18} /></button>}
    </div>
    <nav className="menu-category-strip" aria-label="Menu categories">
      {groups.map(group => <button key={group.name} type="button" aria-current={group.name === activeCategory ? 'location' : undefined} onClick={() => goToCategory(group.name)}>{group.name}</button>)}
    </nav>
    {loading ? <section className="customer-state">Loading today’s menu…</section> : error ? <section className="customer-state error-state"><h2>We couldn’t load the menu.</h2><p>{error}</p></section> : filtered.length ? <div className="menu-grouped-results">{groups.map(group => <section className="menu-category-section" id={sectionId(group.name)} data-menu-category={group.name} key={group.name} aria-labelledby={sectionId(group.name) + '-title'}>
      <header className="menu-category-heading"><div><h2 id={sectionId(group.name) + '-title'}>{group.name}</h2></div></header>
      {group.products.length ? <div className="customer-products menu-results-grid">{group.products.map(renderProduct)}</div> : <p className="menu-group-empty">No best sellers yet.</p>}
    </section>)}<div className="menu-back-to-top"><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}>Back to top</button></div></div> : <section className="menu-no-results"><Search size={28} aria-hidden="true" /><h2>No matches this time.</h2><p>Try another search.</p><button type="button" onClick={reset}>Reset menu</button></section>}

  </div>
}
