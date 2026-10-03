import './AuthWelcomeScreen.css'

function CoffeeBeanIcon({ className = '', size = 32 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M16 4C9 4 5 9.5 5 16C5 22.5 9 28 16 28C23 28 27 22.5 27 16C27 9.5 23 4 16 4Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16 5.5C12.5 10.5 19.5 16 16 26.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function AuthWelcomeScreen({
  variant = 'login',
  statusText = '',
  isExiting = false,
  isComplete = false,
  overlay = false,
}) {
  const defaultText = variant === 'logout' ? 'Signing you out' : 'Signing you in'
  const rawText = statusText || defaultText
  // Strip static ellipsis if passed so we render lively animated dots instead
  const cleanedText = rawText.replace(/\.{2,}|…/g, '').trim()
  const isFarewell =
    cleanedText.toLowerCase().startsWith('welcome back') ||
    cleanedText.toLowerCase().startsWith('see you') ||
    cleanedText.toLowerCase().startsWith('thanks for')

  return (
    <main
      className={`customer-oauth-callback auth-welcome-screen variant-${variant}${overlay ? ' is-overlay' : ''}${isExiting ? ' is-exiting' : ''}${isComplete ? ' is-complete' : ''}`}
      role="status"
      aria-live="polite"
    >
      {/* Off-screen status for screen readers */}
      <span className="auth-welcome-sr">{cleanedText}</span>

      {/* Floating ambient coffee beans background */}
      <div className="auth-welcome-ambient" aria-hidden="true">
        <span className="ambient-bean bean-1">
          <CoffeeBeanIcon size={46} />
        </span>
        <span className="ambient-bean bean-2">
          <CoffeeBeanIcon size={52} />
        </span>
        <span className="ambient-bean bean-3">
          <CoffeeBeanIcon size={38} />
        </span>
        <span className="ambient-bean bean-4">
          <CoffeeBeanIcon size={42} />
        </span>
        <div className="ambient-glow glow-1" />
      </div>

      <section className="auth-welcome-card">
        {/* Coffee cup illustration with 3 animated rising steam wisps */}
        <div className="auth-welcome-cup-wrap" aria-hidden="true">
          <svg
            className="auth-welcome-cup-svg"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Steam wisps */}
            <g className="auth-welcome-steam-group">
              <path
                className="steam-wisp steam-wisp-1"
                d="M28 26 C25 21, 29 17, 26 11"
                stroke="var(--cr-green, #244a36)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                className="steam-wisp steam-wisp-2"
                d="M38 27 C41 21, 36 16, 39 9"
                stroke="var(--cr-green, #244a36)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                className="steam-wisp steam-wisp-3"
                d="M48 26 C45 20, 49 16, 47 11"
                stroke="var(--cr-green, #244a36)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>

            {/* Saucer */}
            <path
              d="M16 61 C16 65, 64 65, 64 61"
              stroke="var(--cr-green, #244a36)"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Cup body */}
            <path
              d="M21 34 H55 C55 49, 49 56, 38 56 C27 56, 21 49, 21 34 Z"
              fill="#ffffff"
              stroke="var(--cr-green, #244a36)"
              strokeWidth="3"
              strokeLinejoin="round"
            />

            {/* Warm coffee surface accent line */}
            <path
              d="M23 37 Q38 41, 53 37"
              stroke="var(--cr-gold, #d5af67)"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Cup handle */}
            <path
              d="M53 38 C62 38, 62 49, 51 50"
              stroke="var(--cr-green, #244a36)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Staggered word-by-word reveal */}
        {variant === 'logout' ? (
          <h1 className="auth-welcome-heading auth-welcome-heading--logout">
            <span className="word word-1">See</span>{' '}
            <span className="word word-2">you</span>{' '}
            <span className="word word-3">soon!</span>
          </h1>
        ) : (
          <h1 className="auth-welcome-heading">
            <span className="word word-1">Welcome</span>{' '}
            <span className="word word-2">to</span>{' '}
            <span className="word word-3">The</span>{' '}
            <span className="word word-4">Coffee</span>{' '}
            <span className="word word-5">Realm</span>
          </h1>
        )}

        {/* Dynamic subtext with animated dots */}
        <p className="auth-welcome-subtext">
          <span className="auth-welcome-subtext-message">{cleanedText}</span>
          {!isFarewell ? (
            <span className="auth-welcome-dots" aria-hidden="true">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          ) : (
            <span aria-hidden="true">!</span>
          )}
        </p>

        {/* Thin brand-green progress bar at bottom of card */}
        <div className="auth-welcome-progress" aria-hidden="true">
          <div
            className={`auth-welcome-progress-bar${isComplete ? ' is-complete' : ''}`}
          />
        </div>
      </section>
    </main>
  )
}
