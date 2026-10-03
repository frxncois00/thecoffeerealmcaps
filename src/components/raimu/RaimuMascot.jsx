import { useId } from 'react'

// Redrawn from public/assets/raimu/raimu.png. Named, nested SVG groups keep
// breathing, expression, gaze, blinking and gestures on independent transforms.
export default function RaimuMascot({ state = 'idle', blink = false, earTwitch = false, className = '' }) {
  const id = useId().replaceAll(':', '')
  return <svg className={`rc-cat ${className}`} viewBox="0 0 180 190" aria-hidden="true" focusable="false" data-pose={state} data-blink={blink} data-ear-twitch={earTwitch}>
    <defs>
      <linearGradient id={`${id}-fur`} x1="0" y1="0" x2=".8" y2="1"><stop stopColor="var(--rc-fur-light)" /><stop offset="1" stopColor="var(--rc-fur)" /></linearGradient>
      <linearGradient id={`${id}-cap`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--rc-cap-light)" /><stop offset="1" stopColor="var(--rc-cap)" /></linearGradient>
      <linearGradient id={`${id}-eye`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#394533" /><stop offset="1" stopColor="#a3ad64" /></linearGradient>
    </defs>
    <ellipse className="rc-cat-shadow" cx="91" cy="178" rx="51" ry="6" fill="var(--rc-ground)" />
    <g className="rc-cat-pose">
      <g className="rc-cat-breathe">
        <g className="rc-cat-tail" fill="none" strokeLinecap="round">
          <path d="M119 163C156 171 166 147 151 132C145 126 149 116 156 117" stroke="var(--rc-outline)" strokeWidth="17" />
          <path d="M119 163C156 171 166 147 151 132C145 126 149 116 156 117" stroke="var(--rc-fur)" strokeWidth="13" />
          <path d="m148 151 10 3m-11-24 9-7" stroke="var(--rc-stripe)" strokeWidth="6" />
        </g>
        <path d="M64 119C51 135 49 158 59 171C72 180 112 180 123 170C130 157 127 134 115 120Z" fill={`url(#${id}-fur)`} stroke="var(--rc-outline)" strokeWidth="2" />
        <path d="M75 125C65 138 66 159 73 170H109C117 154 113 136 104 125Z" fill="var(--rc-cream)" />
        <path d="m58 145 10 4m-11 7 9 3m52-14-8 4m12 7-10 3" fill="none" stroke="var(--rc-stripe)" strokeWidth="4" strokeLinecap="round" />
        <g className="rc-cat-head">
          <g className="rc-cat-ear rc-cat-ear-left">
            <path d="M40 78C26 63 23 31 32 18C42 15 65 41 69 54Z" fill={`url(#${id}-fur)`} stroke="var(--rc-outline)" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M39 65C32 47 32 31 35 28C44 31 54 44 58 54Z" fill="var(--rc-pink)" />
            <path d="m36 51 9 2-5-8 12 8-3 9-8-3Z" fill="var(--rc-cream)" />
          </g>
          <g className="rc-cat-ear rc-cat-ear-right">
            <path d="M115 56C125 38 148 25 154 29C161 43 153 76 140 85Z" fill={`url(#${id}-fur)`} stroke="var(--rc-outline)" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M126 57C136 43 146 38 149 39C151 49 147 64 140 70Z" fill="var(--rc-pink)" />
            <path d="m143 58-10 3 6-9-13 7 3 11 10-4Z" fill="var(--rc-cream)" />
          </g>
          <path d="M45 58C65 42 109 43 131 62C143 72 144 84 151 92L145 94L154 104L146 105L153 114L142 115C137 140 53 146 36 121L26 120L33 112L25 108L33 100L28 95C38 84 32 70 45 58Z" fill={`url(#${id}-fur)`} stroke="var(--rc-outline)" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M88 84C82 99 79 103 68 105C50 101 39 111 45 122C57 140 126 143 137 122C141 109 125 106 112 108C97 105 95 96 88 84Z" fill="var(--rc-cream)" />
          <g fill="var(--rc-stripe)">
            <path d="M76 57L83 82L87 60ZM92 58L95 86L103 61ZM110 64L109 83L120 67Z" />
            <path d="m36 88 17 8-19-2Zm-3 12 18 5-17 2Zm112-8-16 8 17-2Zm3 13-19 4 16 3Z" />
          </g>
          <g className="rc-cat-brows" fill="var(--rc-stripe)"><path d="M48 84Q55 76 63 83Q54 80 48 84Z" /><path d="M112 84Q122 78 129 87Q119 83 112 84Z" /></g>
          <g className="rc-cat-eyes">
            <g className="rc-cat-eye rc-cat-eye-left">
              <ellipse cx="61" cy="98" rx="15" ry="17" fill="var(--rc-cream)" stroke="var(--rc-outline)" strokeWidth="2" />
              <g className="rc-cat-gaze"><ellipse cx="63" cy="99" rx="11" ry="14" fill={`url(#${id}-eye)`} /><ellipse cx="64" cy="97" rx="6" ry="10" fill="#24291f" /><circle cx="68" cy="91" r="4" fill="#fffdf7" /><circle cx="58" cy="105" r="1.6" fill="#fffdf7" /></g>
            </g>
            <g className="rc-cat-eye rc-cat-eye-right">
              <ellipse cx="119" cy="100" rx="15" ry="17" fill="var(--rc-cream)" stroke="var(--rc-outline)" strokeWidth="2" />
              <g className="rc-cat-gaze"><ellipse cx="117" cy="101" rx="11" ry="14" fill={`url(#${id}-eye)`} /><ellipse cx="117" cy="99" rx="6" ry="10" fill="#24291f" /><circle cx="122" cy="94" r="4" fill="#fffdf7" /><circle cx="111" cy="107" r="1.6" fill="#fffdf7" /></g>
            </g>
          </g>
          <g fill="var(--rc-pink)" opacity=".45"><ellipse cx="48" cy="115" rx="9" ry="4" /><ellipse cx="132" cy="117" rx="9" ry="4" /></g>
          <path d="M83 111Q90 107 97 112Q95 117 90 118Q85 116 83 111Z" fill="var(--rc-nose)" stroke="var(--rc-stripe)" strokeWidth="1.2" />
          <g className="rc-cat-mouth">
            <path className="rc-cat-mouth-open" d="M83 122Q91 127 99 122Q98 133 91 133Q85 133 83 122Z" fill="var(--rc-outline)" />
            <path className="rc-cat-mouth-open" d="M87 129Q92 125 96 130Q91 136 87 129Z" fill="var(--rc-pink)" />
            <path d="M90 118V121Q84 129 78 120M90 121Q98 129 103 121" fill="none" stroke="var(--rc-outline)" strokeWidth="1.8" strokeLinecap="round" />
          </g>
          <g fill="none" stroke="var(--rc-cream)" strokeWidth="1.1" strokeLinecap="round" opacity=".95"><path d="M49 116 21 110M49 121 18 120M51 125 24 131M128 119l28-6m-28 11 31 0m-33 5 27 7" /></g>
          <g className="rc-cat-cap">
            <path d="M91 37Q91 30 99 32Q106 33 103 39" fill="var(--rc-cap-light)" stroke="var(--rc-outline)" strokeWidth="2" />
            <path d="M43 62C54 39 76 33 99 36C127 38 140 55 140 76C118 78 83 54 43 66Z" fill={`url(#${id}-cap)`} stroke="var(--rc-outline)" strokeWidth="2" />
            <path d="M75 40Q58 48 57 61M119 43Q132 56 133 72" fill="none" stroke="#b4be90" opacity=".5" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M42 61C66 49 91 54 112 65L133 77C118 83 98 64 78 64C59 62 45 75 36 74C29 75 31 68 42 61Z" fill={`url(#${id}-cap)`} stroke="var(--rc-outline)" strokeWidth="2" strokeLinejoin="round" />
            <path d="M39 67C64 53 87 60 109 70" fill="none" stroke="#b4be90" opacity=".4" strokeWidth="1" />
            <g transform="rotate(27 103 50)"><ellipse cx="103" cy="50" rx="8" ry="11" fill="var(--rc-cream)" /><path d="M106 40C96 47 109 50 100 60" fill="none" stroke="var(--rc-cap)" strokeWidth="2.4" strokeLinecap="round" /></g>
          </g>
        </g>
        <g className="rc-cat-paw rc-cat-paw-left"><path d="M65 141C52 140 50 154 55 169C58 176 73 175 75 170L72 150Z" fill={`url(#${id}-fur)`} stroke="var(--rc-outline)" strokeWidth="2" /><path d="M59 166v5m6-5v6" stroke="var(--rc-stripe)" strokeWidth="1.5" strokeLinecap="round" /></g>
        <g className="rc-cat-paw rc-cat-paw-right"><path d="M108 141C121 138 128 155 122 169C119 176 104 175 102 170L103 152Z" fill={`url(#${id}-fur)`} stroke="var(--rc-outline)" strokeWidth="2" /><path d="M111 167v5m6-6v6" stroke="var(--rc-stripe)" strokeWidth="1.5" strokeLinecap="round" /></g>
      </g>
    </g>
    <g className="rc-cat-sparkles" fill="var(--rc-sparkle)"><path d="m25 65 2-7 2 7 7 2-7 2-2 7-2-7-7-2Z" /><path d="m153 84 2-6 2 6 6 2-6 2-2 6-2-6-6-2Z" /><path d="m137 20 2-5 2 5 5 2-5 2-2 5-2-5-5-2Z" /></g>
    <g className="rc-cat-sleep" fill="var(--rc-primary)" fontFamily="inherit" fontWeight="600"><text x="143" y="69" fontSize="12">z</text><text x="155" y="51" fontSize="15">z</text><text x="161" y="30" fontSize="18">z</text></g>
  </svg>
}
