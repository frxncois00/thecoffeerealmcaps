import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import RealmProductTour from './RealmProductTour'
import './tailwind.generated.css'
import './realm-tour.css'

createRoot(document.getElementById('realm-tour-root')).render(
  <StrictMode><RealmProductTour /></StrictMode>,
)
