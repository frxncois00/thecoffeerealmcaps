export default function Brand({ light = false }) {
  return (
    <a className={`brand ${light ? 'brand-light' : ''}`} href="/" aria-label="The Coffee Realm home">
      <span className="brand-mark"><img src="/images/coffeerealmlogo.png" alt="" /></span>
      <span>The Coffee Realm</span>
    </a>
  )
}
