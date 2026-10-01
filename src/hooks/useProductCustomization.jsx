import { useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'
import ProductCustomizationModal from '../components/ProductCustomizationModal'

export function needsCustomization(product) {
  return Boolean(
    (product.allowAddons && (product.addons || []).length) ||
    (product.variations || []).length ||
    (product.temperatures || []).length ||
    product.allowIce ||
    product.allowSugar,
  )
}

export function allowsSpecialInstructions(product) {
  const category = String(product.category || '').toLowerCase()
  const name = String(product.name || '').toLowerCase()
  if (/bread|sandwich|cake|meal|snack|pasta/.test(category)) return false
  if (/best.?seller box|sampler box/.test(name)) return false
  if (/cookie/.test(category) && !needsCustomization(product)) return false
  return true
}

export function useProductCustomization({ alwaysCustomize = false, modalVariant = '', beforeAdd, openDrawerOnAdd = true } = {}) {
  const { addItem } = useCart()
  const [product, setProduct] = useState(null)
  const triggerRef = useRef(null)

  const openProduct = (item, trigger = document.activeElement) => {
    triggerRef.current = trigger
    setProduct(item)
  }

  const closeProduct = () => {
    const closingProductId = String(product?.id ?? '')
    setProduct(null)
    window.setTimeout(() => {
      if (document.querySelector('[role="dialog"][aria-modal="true"]:not(.customize-modal):not([aria-hidden="true"])')) return
      const trigger = triggerRef.current?.isConnected
        ? triggerRef.current
        : [...document.querySelectorAll('[data-product-id]')].find((element) => element.dataset.productId === closingProductId)
      trigger?.focus()
    }, 400)
  }

  const addToCart = (item) => {
    if (alwaysCustomize || needsCustomization(item) || allowsSpecialInstructions(item)) {
      openProduct(item)
      return
    }
    addItem({
      productId: item.id,
      slug: item.slug || item.id,
      name: item.name,
      image: item.image,
      variation: null,
      temperature: '',
      ice: '',
      sugar: '',
      addons: [],
      instructions: '',
      quantity: 1,
      unitPrice: item.basePrice ?? item.price,
    })
  }

  const modal = <AnimatePresence>{product ? (
    <ProductCustomizationModal
      key={product.id}
      product={product}
      variant={modalVariant}
      onClose={closeProduct}
      onAdd={(payload) => {
        if (beforeAdd && !beforeAdd(payload)) {
          closeProduct()
          return
        }
        addItem(payload, { openDrawer: openDrawerOnAdd })
        closeProduct()
      }}
    />
  ) : null}</AnimatePresence>

  return { addToCart, openProduct, modal }
}
