import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { preload } from 'react-dom'
import RealmProductTour from './RealmProductTour'
import { environment } from './products'
import { initialQuality } from './performance'
import { responsiveImage } from './responsiveImage'
import './tailwind.generated.css'
import './realm-tour.css'

// PERF: preload only the opening photograph, using exactly the same candidate
// set as the image component to avoid duplicate mobile/desktop downloads.
const tier = initialQuality({ cores: navigator.hardwareConcurrency, memory: navigator.deviceMemory, mobile: matchMedia('(pointer: coarse)').matches })
const hero = responsiveImage(environment.opening, tier)
preload(hero.src, { as: 'image', imageSrcSet: hero.srcSet, imageSizes: hero.sizes, fetchPriority: 'high' })

createRoot(document.getElementById('realm-tour-root')).render(
  <StrictMode><RealmProductTour /></StrictMode>,
)
