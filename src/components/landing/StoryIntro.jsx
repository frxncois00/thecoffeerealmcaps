import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import Reveal from './LandingReveal'
import { StoryImage } from './LandingAccents'
import './story-intro.css'

function StoryCopy({ titleId }) {
  return <>
    <span className="eyebrow">Our story</span>
    <h2 id={titleId}>The Coffee Realm began at home.</h2>
    <p>Founded by Mary Grace Baula Jose and Ian Jose, The Coffee Realm grew from a shared passion for coffee and years of café experience into a welcoming place for coffee, food, and desserts in North Fairview, Quezon City.</p>
    <p>What started as a small home-based business now serves both walk-in and online customers, with a growing team behind every order.</p>
  </>
}

export default function StoryIntro() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)

  return <div className="landing-about-intro">
    <Reveal
      tag="div"
      className={`landing-about-image-wrap${open ? ' is-story-open' : ''}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false)
          triggerRef.current?.focus()
        }
      }}
    >
      <StoryImage />
      <button
        ref={triggerRef}
        type="button"
        className="landing-story-trigger"
        aria-expanded={open}
        aria-controls="landing-story-overlay"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="landing-story-trigger-icon" aria-hidden="true">{open ? <X size={22} /> : '?'}</span>
        <span className="landing-story-trigger-label">Learn more about us.</span>
      </button>
      <div id="landing-story-overlay" className="landing-story-overlay" aria-hidden={!open} inert={!open}>
        <div className="landing-story-overlay-copy" role="region" aria-labelledby="landing-story-title" tabIndex={open ? 0 : -1}>
          <StoryCopy titleId="landing-story-title" />
        </div>
      </div>
    </Reveal>
    <Reveal tag="div" className="landing-about-copy" delay={0.08}>
      <StoryCopy titleId="about-title" />
    </Reveal>
  </div>
}
