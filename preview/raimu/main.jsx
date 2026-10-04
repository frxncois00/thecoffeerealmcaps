import { StrictMode, useState, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import { RaimuConversation } from '../../src/components/RaimuWidget'
import RaimuMascot from '../../src/components/raimu/RaimuMascot'
import { raimu, RAIMU_STATES } from '../../src/components/raimu/raimuMachine'
import { ThemeProvider, useTheme } from '../../src/context/ThemeContext'
import '../../src/styles.css'
import '../../src/management-theme.css'

export default function Preview() {
  const { resolvedTheme, setPreference } = useTheme()
  const [enabled, setEnabled] = useState(true)
  const [mode, setMode] = useState('reply')
  const snapshot = useSyncExternalStore(raimu.subscribe, raimu.getSnapshot)
  const requestReply = async (text) => {
    await new Promise((resolve) => window.setTimeout(resolve, 1_600))
    if (mode === 'error') return { error: { message: 'The support service is unavailable. Please try again.' }, data: null }
    if (mode === 'empty') return { data: {} }
    if (mode === 'report') return { data: { text: 'Your sales report is ready. Choose a format below.', download_url: 'data:text/csv;charset=utf-8,Date%2CSales%0A2026-10-04%2C17037.79' } }
    if (mode === 'long') return { data: { text: Array.from({ length: 12 }, (_, index) => `${index + 1}. Review paid orders, then check inventory and pending deliveries. All amounts in this local preview are sample data.`).join('\n\n') } }
    return { data: { text: `I can help with “${text}”. Your store has 12 orders today. Seven are for delivery, one is for pickup, and four are walk-ins.\n\nWould you like a sales report or a closer look at an order?` } }
  }
  return <><main className="studio app-layout legacy-admin" data-theme={resolvedTheme} style={{ display: 'block' }}>
    <span className="kicker">The Coffee Realm / Companion studio</span>
    <h1>A familiar face. A little more alive.</h1>
    <p>Raimu’s motion and conversation preview. Open the cat in the corner to try the actual chat component with local sample replies.</p>
    <div className="studio-controls">
      <button onClick={() => setPreference(resolvedTheme === 'dark' ? 'light' : 'dark')}>Switch to {resolvedTheme === 'dark' ? 'light' : 'dark'}</button>
      <button onClick={() => { setEnabled(true); raimu.setState('greeting'); raimu.say('Hi! Need a hand with sales or orders?') }}>Greet / show Raimu</button>
      <button onClick={() => raimu.reactTo('notification')}>New notification</button>
      <button onClick={() => { raimu.updateContext({ storeOpen: false }); raimu.updateContext({ storeOpen: true }) }}>Store opens</button>
      <button onClick={() => raimu.reactTo('sales-goal')}>Sales goal reached</button>
      <button onClick={() => { raimu.say('First in the queue.', { duration: 2_000 }); raimu.say('And then this one.', { duration: 2_000 }) }}>Queue two bubbles</button>
      <button onClick={() => raimu.setVisible(!snapshot.visible)}>{snapshot.visible ? 'Simulate hidden tab' : 'Resume tab'}</button>
      <label>Reply type<select value={mode} onChange={(event) => setMode(event.target.value)}><option value="reply">Normal reply</option><option value="report">Report</option><option value="long">Long reply</option><option value="error">Service error</option><option value="empty">Empty response</option></select></label>
    </div>
    <div className="pose-grid raimu-companion" data-theme={resolvedTheme} data-motion={snapshot.animated && !snapshot.reducedMotion ? 'full' : 'minimal'} data-paused={!snapshot.visible}>
      {RAIMU_STATES.map((state) => <div className="pose-card" key={state}><RaimuMascot state={state} /><button onClick={() => raimu.setState(state)}>{state}</button></div>)}
    </div>
    <p className="studio-note">Local preview only. No messages are sent to Supabase. Drag the companion to reposition it, or focus it and use Alt + arrow keys. Escape minimizes the chat. Current state: <b>{snapshot.state}</b>.</p>
  </main><RaimuConversation role="admin" sessionKey="local-preview" enabled={enabled} onHide={() => setEnabled(false)} requestReply={requestReply} /></>
}

// Keep the standalone test harness root stable during dependency HMR.
const root = import.meta.hot?.data.root || createRoot(document.getElementById('root'))
if (import.meta.hot) import.meta.hot.data.root = root
root.render(<StrictMode><ThemeProvider><Preview /></ThemeProvider></StrictMode>)
