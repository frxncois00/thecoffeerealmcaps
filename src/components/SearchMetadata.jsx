import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const origin = 'https://www.thecoffeerealm.store'
const pages = {
  '/': ['The Coffee Realm | Café in North Fairview, Quezon City', 'Visit The Coffee Realm in North Fairview, Quezon City for coffee, hearty meals, pastries, and desserts. Browse our menu and order online.'],
  '/menu': ['Menu | The Coffee Realm', 'Explore coffee, meals, pastries, and desserts on The Coffee Realm menu and order your favorites online.'],
  '/about': ['About Us | The Coffee Realm', 'Get to know The Coffee Realm, your café in North Fairview, Quezon City.'],
  '/contact': ['Contact & Location | The Coffee Realm', 'Find The Coffee Realm in North Fairview, Quezon City and get in touch with our team.'],
  '/help': ['Help | The Coffee Realm', 'Find help with ordering, payments, and your Coffee Realm experience.'],
  '/privacy-policy': ['Privacy Policy | The Coffee Realm', 'Read how The Coffee Realm handles and protects your personal information.'],
  '/terms-of-use': ['Terms of Use | The Coffee Realm', 'Read the terms for using The Coffee Realm website and ordering online.'],
}

function meta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = content
}

export default function SearchMetadata() {
  const { pathname } = useLocation()
  useEffect(() => {
    const path = pathname.replace(/\/+$/, '') || '/'
    const page = pages[path]
    const isProduct = /^\/menu\/[^/]+$/.test(path)
    const [title, description] = page || (isProduct
      ? ['Menu Item | The Coffee Realm', pages['/menu'][1]]
      : ['The Coffee Realm', 'The Coffee Realm customer and team portal.'])
    document.title = title
    meta('name', 'description', description)
    meta('name', 'robots', page || isProduct ? 'index, follow' : 'noindex, follow')
    meta('property', 'og:title', title)
    meta('property', 'og:description', description)
    meta('property', 'og:url', `${origin}${path}`)
    meta('name', 'twitter:title', title)
    meta('name', 'twitter:description', description)
    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = `${origin}${path}`
  }, [pathname])
  return null
}
