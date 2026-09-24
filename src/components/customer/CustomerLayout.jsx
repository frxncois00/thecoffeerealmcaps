import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, LogOut, Menu, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import Brand from '../Brand'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { usePricing } from '../../context/usePricing'
import { isCustomerRole } from '../../lib/auth'
import LogoutConfirmModal from '../auth/LogoutConfirmModal'
import { LandingFooter } from '../../pages/LegalPage'
import { formatVatRate, vatBreakdownFromInclusiveAmount } from '../../utils/pricing'

const centerLinks = [['Menu', '/menu'], ['My Orders', '/orders'], ['Help', '/help'], ['Profile', '/profile']]
const landingLinks = [['Menu', '#menu'], ['Our Story', '#about'], ['Visit Us', '#visit']]
const money = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)

export default function CustomerLayout() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { user, profile, signOut } = useAuth()
  const customerUser = user && isCustomerRole(profile?.role) ? user : null
  const cart = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const close = () => setOpen(false)
  const isLandingPage = location.pathname === '/'
  const isPublicLandingChrome = true
  const publicLinks = landingLinks.map(([label, href]) => [label, isLandingPage ? href : `/${href}`])

  useEffect(() => {
    if (!cart.drawerOpen) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const escape = (event) => {
      if (event.key === 'Escape') cart.closeCart()
    }
    document.addEventListener('keydown', escape)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', escape)
    }
  }, [cart])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const resetHorizontalPageScroll = () => {
      if (window.scrollX !== 0) window.scrollTo(0, window.scrollY)
    }

    resetHorizontalPageScroll()
    window.addEventListener('resize', resetHorizontalPageScroll, { passive: true })
    return () => window.removeEventListener('resize', resetHorizontalPageScroll)
  }, [location.pathname])

  async function logout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await signOut()
      close()
      navigate('/')
    } finally {
      setLoggingOut(false)
      setLogoutOpen(false)
    }
  }

  return (
    <div className="customer-app">
      <header className={`customer-header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="customer-brand"><Brand /></div>
        <button className="mobile-cart" type="button" onClick={cart.openCart} aria-label={`Open cart${cart.itemCount ? `, ${cart.itemCount} item${cart.itemCount === 1 ? '' : 's'}` : ''}`} aria-haspopup="dialog">
          <ShoppingBag size={19} />
          {cart.itemCount > 0 && <b aria-hidden="true">{cart.itemCount}</b>}
        </button>
        <button
          className="mobile-menu"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="customer-navigation"
          aria-label="Toggle navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav id="customer-navigation" className={open ? 'open' : ''}>
          <div className="customer-nav-center">
            {customerUser
              ? centerLinks.map(([label, to]) => <NavLink key={to} to={to} onClick={close}>{label}</NavLink>)
              : isPublicLandingChrome
                ? publicLinks.map(([label, href]) => <a key={href} href={href} onClick={close}>{label}</a>)
                : null}
          </div>
          <div className="customer-nav-actions">
            <button className="nav-cart" type="button" onClick={() => { close(); cart.openCart() }} aria-haspopup="dialog">
              <ShoppingBag size={18} />
              {cart.itemCount > 0 && <b aria-label={`${cart.itemCount} cart items`}>{cart.itemCount}</b>}
            </button>
            {customerUser ? (
              <button className="nav-auth-action" type="button" onClick={() => setLogoutOpen(true)}>
                <LogOut size={18} />
                Logout
              </button>
            ) : (
              <NavLink className="nav-auth-action" to="/login" onClick={close}>
                <LogIn size={18} />
                Log in
              </NavLink>
            )}
          </div>
        </nav>
      </header>
      <div className="customer-route-shell" key={location.pathname}><Outlet /></div>
      <CartDrawer cart={cart} user={customerUser} />
      <LandingFooter />
      <LogoutConfirmModal
        open={logoutOpen}
        busy={loggingOut}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={logout}
      />
    </div>
  )
}

function CartDrawer({ cart, user }) {
  const [confirmClear, setConfirmClear] = useState(false)
  const [proceeding, setProceeding] = useState(false)
  const { pricing } = usePricing()
  const navigate = useNavigate()
  const { baseAmount, vatAmount } = vatBreakdownFromInclusiveAmount(cart.subtotal, pricing.vatRate, pricing.pricesIncludeVat)
  const clear = () => { cart.clearCart(); setConfirmClear(false) }
  const proceedToCheckout = async () => {
    if (proceeding) return
    if (!user) {
      cart.closeCart()
      navigate('/login', { state: { from: '/checkout' } })
      return
    }
    setProceeding(true)
    const result = await cart.refreshAvailability()
    setProceeding(false)
    if (!result.ok || !result.available) return
    cart.closeCart()
    navigate('/checkout')
  }

  return (
    <>
      <button
        className={`cart-drawer-backdrop ${cart.drawerOpen ? 'visible' : ''}`}
        onClick={cart.closeCart}
        aria-label="Close cart"
        tabIndex={cart.drawerOpen ? 0 : -1}
      />
      <aside
        className={`cart-drawer ${cart.drawerOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!cart.drawerOpen}
        aria-labelledby="cart-drawer-title"
      >
        <header>
          <div><span>Your order</span><h2 id="cart-drawer-title">Cart <b>{cart.itemCount}</b></h2></div>
          <button type="button" onClick={cart.closeCart} aria-label="Close cart"><X /></button>
        </header>
        <div className="cart-drawer-body">
          {cart.items.length === 0 ? (
            <div className="drawer-empty">
              <ShoppingBag />
              <h3>Your cart is empty</h3>
              <p>Add something you love from today's menu.</p>
              <Link className="primary-button" to="/menu" onClick={cart.closeCart}>Browse menu</Link>
            </div>
          ) : cart.items.map((item) => (
            <article className={`drawer-cart-item${item.available===false?' is-unavailable':''}`} key={item.lineId}>
              <img src={item.image} alt="" />
              <div>
                <h3>{item.name}</h3>
                {item.available===false&&<span className="drawer-unavailable-badge">Unavailable</span>}
                {item.available===false&&<p className="drawer-unavailable-reason">{item.availabilityReason||'Currently out of stock'}</p>}
                <p>{[item.variation?.name, item.temperature, item.ice, item.sugar].filter(Boolean).join(' · ')}</p>
                {item.addons?.length > 0 && <small>{item.addons.map((addon) => addon.name).join(', ')}</small>}
                <strong>{money((item.unitPrice + (item.addons || []).reduce((sum, addon) => sum + addon.price, 0)) * item.quantity)}</strong>
                <div className="drawer-item-actions">
                  <button onClick={() => cart.updateQuantity(item.lineId, item.quantity - 1)} aria-label={`Decrease ${item.name}`} disabled={item.available===false}><Minus /></button>
                  <b>{item.quantity}</b>
                  <button onClick={() => cart.updateQuantity(item.lineId, item.quantity + 1)} aria-label={`Increase ${item.name}`} disabled={item.available===false}><Plus /></button>
                  <button className="remove-line" onClick={() => cart.removeItem(item.lineId)} aria-label={`Remove ${item.name}`}><Trash2 /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {cart.items.length > 0 && (
          <footer>
            <div><span>VATable Sale</span><b>{money(baseAmount)}</b></div>
            <div className="customer-vat-row"><span>{formatVatRate(pricing.vatRate)} VAT</span><b>{money(vatAmount)}</b></div>
            <p>Delivery fees and discounts are calculated during checkout.</p>
            {cart.hasUnavailableItems&&<p className="drawer-availability-warning" role="alert">Remove {cart.unavailableItems.length} unavailable item{cart.unavailableItems.length===1?'':'s'} before checkout.</p>}
            {cart.availabilityError&&<p className="drawer-availability-warning" role="alert">{cart.availabilityError}</p>}
            <button className="primary-button" type="button" disabled={cart.hasUnavailableItems||cart.checkingAvailability||proceeding} onClick={proceedToCheckout}>{cart.checkingAvailability||proceeding?'Checking availability…':cart.hasUnavailableItems?'Checkout unavailable':'Proceed to checkout'}</button>
            <button className="drawer-clear" type="button" onClick={() => setConfirmClear(true)}><Trash2 />Clear cart</button>
          </footer>
        )}
      </aside>
      {confirmClear && (
        <div className="clear-cart-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmClear(false) }}>
          <section className="clear-cart-modal" role="alertdialog" aria-modal="true" aria-labelledby="clear-cart-title" aria-describedby="clear-cart-copy">
            <span><Trash2 /></span>
            <h2 id="clear-cart-title">Clear your cart?</h2>
            <p id="clear-cart-copy">This will remove all {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'} from your cart.</p>
            <div>
              <button className="secondary-button" type="button" onClick={() => setConfirmClear(false)}>Keep items</button>
              <button className="danger-button" type="button" onClick={clear}>Clear cart</button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
