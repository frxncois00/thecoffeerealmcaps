# Raimu Companion

Implemented in the existing React dashboard. No dependencies were added.

## Inspection and file plan

The project uses React 19, Vite, React Router, plain CSS, Lucide icons, and Framer Motion. Rive is also installed. Raimu previously lived entirely in `src/components/RaimuWidget.jsx`, mounted once from `src/App.jsx`. The header toggle lives in `src/components/AppShell.jsx`. The reference image is `public/assets/raimu/raimu.png`; the old widget rules remain in `src/styles.css` around line 6852. New `rc-*` classes isolate the companion from those legacy rules and from the separate support-page styles.

Existing theme tokens in `src/management-theme.css` are reused directly:

| Token | Light | Dark |
| --- | --- | --- |
| `--mgmt-primary` | `#147d57` | `#65a875` |
| `--mgmt-primary-strong` | `#0e6646` | `#82b98b` |
| `--mgmt-success-soft` | `#edf8f1` | `#10231b` |
| `--mgmt-surface` | `#fff` | `#0d1715` |
| `--mgmt-border` | `#e1e7e4` | `#293730` |
| `--mgmt-text` | `#202824` | `#f1f4f2` |
| `--mgmt-muted` | `#68736e` | `#a6b0aa` |

The root also has `--forest`, `--sage`, `--sage-pale`, `--cream`, `--paper`, `--ink`, `--muted`, `--line`, `--gold`, `--danger`, and `--shadow`. The mascot uses the existing gold token for sparkles. Its illustration colors are scoped separately from UI theme colors.

| File | Responsibility |
| --- | --- |
| `src/components/raimu/RaimuMascot.jsx` | Layered SVG: head, ears, eyes, pupils, mouth, cap, tail, paws, sparkles, sleep marks |
| `src/components/raimu/raimuMachine.js` | Public API, transient states, idle timer, random blink/twitch, queued speech, contextual events, suspended clocks |
| `src/components/raimu/useRaimu.js` | React subscription, session greeting, storage, reduced motion, visibility and activity listeners |
| `src/components/raimu/useRaimuPosition.js` | Drag, keyboard repositioning, viewport clamping, mobile keyboard/rotation handling |
| `src/components/raimu/raimu-companion.css` | All mascot, panel, speech and message styling/animation |
| `src/components/RaimuWidget.jsx` | Existing auth/role gate, Supabase request, message history, reports; companion integration and accessible panel |
| `src/components/AppShell.jsx` | Existing header visibility synchronization and notification pulse |
| `src/pages/AdminDashboard.jsx` | Store status context; refreshes for portal configuration changes |
| `src/pages/SystemSettingsPage.jsx` | Store-opening reaction after a successful settings save |
| `src/management-theme.css` | Adds the companion to the existing light/dark token selectors |
| `tests/raimuMachine.test.js` | Deterministic state, timing, interruption, queue and lifecycle tests |
| `preview/raimu/index.html`, `preview/raimu/main.jsx` | Development-only interactive pose and chat preview with local sample replies |

The full contents of every implementation, integration, test and preview file are in `raimu-companion-source.md`. They are complete files, not partial snippets. They are already applied in this checkout.

## Exact integration

`App.jsx` already renders `<RaimuWidget />` inside the existing auth and theme providers; leave that mount in place. No extra provider, route, stylesheet import in `main.jsx`, environment variable, or database migration is needed. The widget imports its own CSS.

Import the public controller anywhere an operation needs to trigger a reaction:

```js
import { raimu } from './components/raimu/raimuMachine'

raimu.setState('thinking')
raimu.say('I’m checking that for you.', { duration: 3500 })
```

Use a relative import appropriate to the calling file. These calls are already wired in the widget:

| Existing lifecycle | Integrated call |
| --- | --- |
| Composer `onChange` | `setState('listening')`, or `idle` for an empty draft |
| `send`, immediately before `requestReply` | `clearBubbles(); setState('thinking')` |
| Successful `support-chat` result | `setState('talking', { onComplete })` |
| Successful response containing `download_url` | After talking, `setState('success'); say('Your report is ready.')` |
| SDK error, `data.error`, or thrown request | `setState('error')` |
| No response text | `setState('empty')` |
| `exportReport`, before download | `setState('thinking')` |
| Completed CSV/Excel/PDF generation | `setState('success'); say('Your download is ready.')` |
| Failed export | Error message in the conversation plus `setState('error')` |

The production request is still `supabase.functions.invoke('support-chat', { body: { message: text, role } })`. Roles, report formats, and the existing response shape are preserved. Minimize keeps history. Close-and-clear invalidates pending replies so a late result cannot repopulate a cleared conversation. New requests are guarded against duplicate submits. Report blob URLs are released after download.

For an eventual streaming implementation:

```js
raimu.setState('thinking')
// When the first reply chunk arrives:
raimu.setState('talking', { duration: 0 })
// Continue appending chunks using your chat state. On completion:
raimu.setState('idle')
// On failure:
raimu.setState('error')
```

For other completed actions:

```js
await yourExistingAction()
raimu.reactTo('success')
raimu.say('All taken care of.', { duration: 3000 })
```

### Contextual events

`AppShell` calls `raimu.reactTo('notification')` when its visible unread count increases. This pulses the ring without interrupting a reply. The dashboard and system settings call `raimu.updateContext({ storeOpen })`; only a closed-to-open transition celebrates, not an initial page load. A store save fires only after the existing save succeeds. Remote updates use the existing Supabase realtime mechanism and require its normal table publication configuration.

There is **no configured daily sales goal in the existing data model**. The module implements crossing detection and once-per-business-day deduplication, but intentionally does not invent a financial target. When your application supplies that target, call this from the metrics update:

```js
raimu.updateContext({
  sales: metrics.totalSales,
  goal: configuredDailyGoal, // your real numeric goal, in the same currency/unit
  day: businessDayKey,       // e.g. '2026-10-04', using the store’s timezone
})
```

Alternatively call `raimu.reactTo('sales-goal')` from an existing goal-reached event. Contextual celebrations defer while Raimu listens, thinks, or talks. The latest pending celebration is retained to avoid a burst of stale reactions.

### Public API

```js
// States: idle, attention, greeting, listening, thinking, talking,
// success, error, empty, sleepy.
raimu.setState('talking', {
  duration: 1800, // milliseconds; 0 holds until explicitly changed
  onComplete: () => raimu.setState('idle'), // optional; replaces default settling
})
raimu.say('Short, plain text message', { duration: 4500, id: 'optional-dedup-key' })
raimu.dismissBubble()
raimu.clearBubbles()
// Events: notification, store-open, sales-goal, success.
raimu.reactTo('notification')
raimu.updateContext({ storeOpen, sales, goal, day })
```

Invalid state names are ignored and return `false`. Speech is limited to 240 characters and four pending messages plus the visible message. The widget owns `start`, `stop`, preferences, visibility, and subscriptions; normal callers do not need those lifecycle methods.

## Tweakable values

| Location | Defaults |
| --- | --- |
| `RAIMU_TIMINGS.idleDelay` | 60,000 ms of idle time |
| `blinkMin`, `blinkMax`, `blinkDuration` | 3–6 s, 150 ms blink |
| `earMin`, `earMax`, `earDuration` | 6–10 s, 420 ms twitch |
| `listening` | Settles 1,800 ms after the last keystroke |
| `talking`, `success`, `error`, `empty` | 1,800 / 1,400 / 2,600 / 2,600 ms |
| Default speech duration | 4,500 ms; greeting bubble 5,500 ms |
| CSS `--rc-breathe`, `--rc-tail` | 4.8 s / 5.4 s |
| `rc-breathe` keyframe | Scale 1 → 1.015 → 1 |
| CSS `--rc-reaction`, `--rc-spring`, `--rc-sine` | 420 ms; ease-out-back reactions; sine-like loops |
| CSS `--rc-fur`, `--rc-fur-light`, `--rc-cap`, `--rc-cap-light` | Orange/cream and dark green artwork colors |
| `.rc-dock` | 132×148 desktop; 100×112 below 560 px |
| `useRaimuPosition` | Panel max 392×524 px; viewport gutter 12 px |
| Local storage | `raimu-animated`; existing `raimu-visible` |

Animated Raimu is available in the panel footer. Turning it off preserves static state poses and brief fades. OS reduced-motion and the existing workspace “Reduce motion” preference both override animation. Storage failures gracefully fall back to the current session. A stored hide preference is honored; with no previous visibility preference, Raimu starts visible.

## Accessibility and performance

The panel is a nonmodal dialog, so the dashboard remains usable. Opening focuses the input; Escape or minimize returns focus to the launcher. Tab navigation is native, all controls have labels and visible focus, and bot replies have polite live announcements. There is a keyboard alternative to dragging: Alt + arrows; Alt + Shift + arrows moves farther. The reset-position button restores the corner.

Message auto-scroll follows the conversation while the reader is near the bottom. If the reader scrolls up, new replies expose a “Latest message” button. Mobile uses visual viewport resize events to accommodate the keyboard. Reduced motion disables smooth scrolling.

All companion keyframes animate transform and opacity. Shadows, gradients and the frosted surface are static. Gaze and dragging write one transform per animation frame and measure layout at gesture start, open, or resize. Hidden tabs suspend CSS animations and controller timers, preserving remaining speech/reaction durations. Listener, observer, frame and timer cleanup handles unmount and React StrictMode. No device-specific 60 fps measurement is claimed.

## Assumptions and validation

- The supplied PNG is a flattened illustration, so Raimu is a vector redraw of its orange tabby, cream muzzle, olive eyes, green cap and coffee-bean badge. It is not a lossless extraction of original image layers. Body, paws and tail extend that reference.
- A session is the authenticated user plus `last_sign_in_at`, with tab-session greeting persistence. Token refresh does not repeatedly greet.
- The current endpoint returns complete replies, not streaming chunks. Talking is therefore a short reaction after the reply arrives.
- No production data or live support requests are needed for the isolated preview; responses are local fixtures. Authenticated production endpoint behavior remains dependent on the existing Supabase service.
- No deployment or database change is included.

Run from the project directory:

```sh
node tests/raimuMachine.test.js
npx --no-install eslint src/components/RaimuWidget.jsx src/components/raimu src/components/AppShell.jsx src/pages/AdminDashboard.jsx src/pages/SystemSettingsPage.jsx tests/raimuMachine.test.js preview/raimu/main.jsx
npm run build
npm run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173/preview/raimu/` for the local interactive preview. It is not included by the production Vite entry configuration. Use it to exercise all poses, queueing, notifications, store/goal reactions, normal/long/report/error/empty replies, and simulated hidden-tab suspension.

The deterministic tests cover sleep/wake, priorities, suspended clocks, speech order/bounds/deduplication, reduced/disabled motion, session lifecycle, interrupted replies, typing inactivity, and store/goal transitions. Nine tests, targeted ESLint, and both existing Vite production builds pass, including the final refinements. Vite reports its existing large-bundle advisory. Browser verification uses local fixtures and covers desktop, 375×812 mobile and 667×375 landscape layout, dark mode, keyboard focus, history/minimize, loading/error/report feedback, saved motion preferences, and paused CSS animations in simulated tab suspension. The browser download observer timed out; the CSV handler’s successful completion and feedback were verified, but the downloaded file was not inspected. The live authenticated support endpoint was not exercised.

Preview captures: [Desktop conversation](raimu-desktop.jpg) and [Mobile dark mode](raimu-mobile-dark.jpg).
