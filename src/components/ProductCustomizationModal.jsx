import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Minus, Plus, ShoppingBag, X } from 'lucide-react'
import Choice from './Choice'
import { money } from '../utils/money'
import { allowsSpecialInstructions } from '../hooks/useProductCustomization'
import { uniqueAddons } from '../utils/menuAddons'
import { lockBodyScroll, unlockBodyScroll } from '../utils/bodyScrollLock'

export default function ProductCustomizationModal({ product, onClose, onAdd, variant = '' }) {
  const closeButtonRef = useRef(null)
  const modalRef = useRef(null)
  const scrollLockRef = useRef(Symbol('product-customization'))
  const onCloseRef = useRef(onClose)
  const submittedRef = useRef(false)
  const reducedMotion = useReducedMotion()
  onCloseRef.current = onClose
  const [variationId, setVariationId] = useState('')
  const [temperature, setTemperature] = useState('')
  const [ice, setIce] = useState('Default Ice')
  const [sugar, setSugar] = useState('75%')
  const [addons, setAddons] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [instructions, setInstructions] = useState('')

  useEffect(() => {
    const modalNode = modalRef.current
    const scrollLock = scrollLockRef.current
    lockBodyScroll(scrollLock)
    closeButtonRef.current?.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
      }
      if (event.key !== 'Tab') return
      const focusable = [...modalRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.getClientRects().length > 0)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && (document.activeElement === first || !modalRef.current.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !modalRef.current.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      const nextDialog = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')]
        .find((element) => element !== modalNode && !element.classList.contains('customize-modal') && element.getAttribute('aria-hidden') !== 'true')
      unlockBodyScroll(scrollLock)
      window.removeEventListener('keydown', handleKeyDown)
      if (nextDialog) nextDialog.querySelector('button, [href], input')?.focus()
    }
  }, [])

  const variations = product.variations || []
  const temperatures = product.temperatures || []
  const variation = variations.find((v) => v.id === (variationId || variations[0]?.id)) || null
  const selectedTemperature = temperature || temperatures[0] || ''
  const isCold = /cold|iced/i.test(selectedTemperature)
  const applicableAddons = product.allowAddons
    ? uniqueAddons((product.addons || [])
      .filter((a) => !a.appliesTo || a.appliesTo === 'both' || a.appliesTo === product.itemType))
    : []
  const selectedAddons = addons.filter((a) => applicableAddons.some((valid) => valid.id === a.id))
  const simpleProduct = !variations.length && !temperatures.length && !applicableAddons.length && !product.allowIce && !product.allowSugar
  const unitPrice = variation?.price ?? product.basePrice ?? product.price
  const total = (unitPrice + selectedAddons.reduce((sum, a) => sum + a.price, 0)) * quantity
  const toggleAddon = (addon) =>
    setAddons((current) => (current.some((x) => x.id === addon.id) ? current.filter((x) => x.id !== addon.id) : [...current, addon]))

  const confirm = () => {
    if (submittedRef.current) return
    submittedRef.current = true
    onAdd({
      productId: product.id,
      slug: product.slug || product.id,
      name: product.name,
      image: product.image,
      variation,
      temperature: selectedTemperature,
      ice: product.allowIce && isCold ? ice : '',
      sugar: product.allowSugar ? sugar : '',
      addons: selectedAddons,
      instructions,
      quantity,
      unitPrice,
    })
  }

  return (
    <motion.div
      className="payment-modal-backdrop customize-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.24 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <motion.section ref={modalRef} className={`payment-modal customize-modal${variant ? ` customize-modal-${variant}` : ''}${simpleProduct ? ' is-simple' : ''}`} role="dialog" aria-modal="true" aria-labelledby="customize-modal-title" initial={reducedMotion ? false : { opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }} transition={{ duration: reducedMotion ? 0 : 0.24, ease: 'easeOut' }}>
        <button ref={closeButtonRef} className="payment-modal-close" type="button" onClick={onClose} aria-label="Close customization">
          <X size={20} />
        </button>
        <div className="customize-modal-head customize-modal-visual">
          <img src={product.image} alt={product.name} />
          <div>
            <span className="payment-modal-kicker">{product.category}</span>
            <div className="customize-product-title-row">
              <h2 id="customize-modal-title">{product.name}</h2>
              <strong className="customize-product-price">{money(unitPrice)}</strong>
            </div>
            {product.description && <p>{product.description}</p>}
          </div>
        </div>

        <div className="customize-modal-body">

          {variations.length > 0 && (
            <Choice title={product.category === 'Cakes' ? 'Portion' : 'Option'} options={variations} value={variation?.id} onChange={setVariationId} />
          )}
          {temperatures.length > 0 && (
            <Choice
              title="Temperature"
              options={temperatures.map((x) => ({ id: x, name: x }))}
              value={selectedTemperature}
              onChange={setTemperature}
            />
          )}
          {product.allowIce && isCold && (
            <Choice title="Ice level" options={(product.iceLevels || []).map((x) => ({ id: x, name: x }))} value={ice} onChange={setIce} />
          )}
          {product.allowSugar && (
            <Choice title="Sweetness level" options={(product.sugars || []).map((x) => ({ id: x, name: x }))} value={sugar} onChange={setSugar} />
          )}
          {applicableAddons.length > 0 && (
            <fieldset className="choice-group">
              <legend>Add-ons</legend>
              {applicableAddons.map((a) => (
                <label className="check-choice" key={a.id}>
                  <input type="checkbox" checked={selectedAddons.some((x) => x.id === a.id)} onChange={() => toggleAddon(a)} />
                  <span>{a.name}</span>
                  <b>+{money(a.price)}</b>
                </label>
              ))}
            </fieldset>
          )}
          {allowsSpecialInstructions(product) && <label className="field">
            <span>Special instructions</span>
            <textarea value={instructions} maxLength={300} onChange={(event) => setInstructions(event.target.value)} placeholder="Allergies or preparation notes" />
          </label>}
        </div>

        <div className="add-bar">
          <div className="quantity-control">
            <span>Quantity</span>
            <div className="quantity">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity === 1} aria-label="Decrease quantity">
                <Minus />
              </button>
              <b key={quantity} className="customize-quantity-value" aria-live="polite">{quantity}</b>
              <button type="button" onClick={() => setQuantity((q) => Math.min(99, q + 1))} disabled={quantity === 99} aria-label="Increase quantity">
                <Plus />
              </button>
            </div>
          </div>
          <button className="primary-button" type="button" onClick={confirm}>
            <ShoppingBag size={18} /> Add to Cart · <span aria-live="polite">{money(total)}</span>
          </button>
        </div>
      </motion.section>
    </motion.div>
  )
}
