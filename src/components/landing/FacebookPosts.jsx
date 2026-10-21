import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import './facebook-posts.css'

const posts = [
  { id: 'store-reel', title: 'Little café moments', url: 'https://www.facebook.com/reel/3549936258521679/', height: 476, video: true, showText: false },
  { id: 'store-post', title: 'The Coffee Realm post', url: 'https://www.facebook.com/thecoffeerealmx/posts/pfbid0AgYQaBHBX5qBd4ZEfvWk1Bxd5dVSX7hxN9orHiiAqSYFPJhDweVfVoV2nqGckeUvl', height: 333, showText: false },
  { id: 'store-update', title: 'Join our team', url: 'https://www.facebook.com/thecoffeerealmx/posts/pfbid02hh835TUFZuriSw3SJ7WxVQsBqFeGnGMWaaka9opsUpyGzrH4cjQ5fr9iDJb3PqG6l', height: 498, showText: false },
]

function FacebookPost({ post, index, active }) {
  const container = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.min(post.video ? 267 : 500, Math.floor(entry.contentRect.width)))
    })
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [post.video])
  const params = new URLSearchParams({ href: post.url, show_text: String(post.showText !== false), width: String(width) })
  if (post.video) { params.set('height', '476'); params.set('t', '0') }
  return <article data-active={active} className={`facebook-post facebook-post-${post.id}${post.video ? ' facebook-post-reel' : ''}`}>
    <div className="facebook-post-embed" ref={container}>
      {width > 0 && <iframe
        title={`The Coffee Realm Facebook ${post.video ? 'reel' : 'post'} ${index + 1}`}
        src={`https://www.facebook.com/plugins/${post.video ? 'video' : 'post'}.php?${params}`}
        width={width} height={post.video ? post.height : Math.ceil(width * post.height / 500)} loading="lazy" scrolling="no"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
      />}
    </div>
  </article>
}

export default function FacebookPosts() {
  const [activeIndex, setActiveIndex] = useState(0)
  const movePost = (direction) => setActiveIndex((current) => (current + direction + posts.length) % posts.length)
  return <section className="facebook-posts" aria-labelledby="facebook-posts-title">
    <div className="facebook-posts-heading">
      <div><h2 id="facebook-posts-title">Latest updates from our café</h2></div>
      <a href="https://www.facebook.com/thecoffeerealmx" target="_blank" rel="noopener noreferrer">@thecoffeerealmx <ArrowUpRight size={17} aria-hidden="true" /></a>
    </div>
    <div className="facebook-posts-grid" id="facebook-posts-slides">{posts.map((post, index) => <FacebookPost key={post.id} post={post} index={index} active={index === activeIndex} />)}</div>
    <div className="facebook-posts-controls">
      <button type="button" onClick={() => movePost(-1)} aria-label="View previous café post" aria-controls="facebook-posts-slides"><ChevronLeft size={21} aria-hidden="true" /></button>
      <span aria-live="polite" aria-atomic="true">{activeIndex + 1} / {posts.length}<span className="facebook-posts-current-title"> — {posts[activeIndex].title}</span></span>
      <button type="button" onClick={() => movePost(1)} aria-label="View next café post" aria-controls="facebook-posts-slides"><ChevronRight size={21} aria-hidden="true" /></button>
    </div>
  </section>
}
