import { useId } from 'react'

const starPath = 'M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26Z'

export default function RatingStars({ rating }) {
  const id = useId()
  const value = Math.max(0, Math.min(5, Number(rating) || 0))
  return <div className="menu-feedback-stars" aria-hidden="true">
    {[0, 1, 2, 3, 4].map(index => {
      const fill = Math.max(0, Math.min(1, value - index))
      return <svg key={index} viewBox="0 0 24 24" focusable="false">
        <defs>
          <linearGradient id={`${id}-gold-${index}`} x1="0" y1="0" x2="0.25" y2="1">
            <stop offset="0" stopColor="#ffe7a0" /><stop offset=".4" stopColor="#e4b94e" /><stop offset=".65" stopColor="#c68e28" /><stop offset="1" stopColor="#e4bc65" />
          </linearGradient>
          <clipPath id={`${id}-fill-${index}`}><rect x="2" y="0" width={20 * fill} height="24" /></clipPath>
        </defs>
        <path d={starPath} fill="#fff" stroke="#d8c7a6" strokeWidth=".8" strokeLinejoin="round" />
        <path d={starPath} fill={`url(#${id}-gold-${index})`} clipPath={`url(#${id}-fill-${index})`} />
      </svg>
    })}
  </div>
}
