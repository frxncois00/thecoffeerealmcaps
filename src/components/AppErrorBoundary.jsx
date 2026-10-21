import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('The Coffee Realm could not render:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return <main role="alert" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f8f6f0', color: '#1b2f22' }}>
      <section style={{ maxWidth: 560, width: '100%' }}>
        <h1>We couldn’t load this page</h1>
        <p>Please reload to try again. If this continues, share the error below so we can resolve it.</p>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', padding: 16, background: '#e9eee8', borderRadius: 12 }}>{this.state.error.message || String(this.state.error)}</pre>
        <button type="button" onClick={() => window.location.reload()} style={{ padding: '12px 24px', border: 0, borderRadius: 24, background: '#214d38', color: '#fff', cursor: 'pointer' }}>Reload page</button>
      </section>
    </main>
  }
}
