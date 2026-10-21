import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRealmMotion } from '../motion/useRealmMotion'
import './ordering-ticket.css'

const steps = [
  { title: 'Browse the menu', description: 'Find your favorites.' },
  { title: 'Add to cart', description: 'Choose your items and quantities.' },
  { title: 'Check out', description: 'Confirm your order and payment.' },
  { title: 'Wait or visit the store', description: 'Have it delivered or pick it up.' },
]

const foods = [
  { key: 'latte', image: 'biscoff-latte-cutout.webp', height: 680, imageWidth: 510, floating: { x: '48%', y: '-4%', width: '45%', rotate: 6 }, settled: { x: '42%', y: '15%', width: '36%', rotate: 0 } },
  { key: 'meal', image: 'katsu-curry-cutout.webp', height: 760, imageWidth: 760, floating: { x: '-2%', y: '13%', width: '60%', rotate: -7 }, settled: { x: '8%', y: '37%', width: '39%', rotate: -2, scaleY: .7 } },
  { key: 'sandwich', image: 'chicken-sandwich-cutout.webp', height: 1254, imageWidth: 1254, floating: { x: '20%', y: '57%', width: '38%', rotate: -5 }, settled: { x: '42%', y: '48%', width: '27%', rotate: 0 } },
  { key: 'cake', image: 'red-velvet-slice-plate-cutout.webp', height: 1254, imageWidth: 1254, floating: { x: '64%', y: '51%', width: '30%', rotate: 5 }, settled: { x: '69%', y: '49%', width: '23%', rotate: 0 } },
]

const sampleReceiptItems = [
  { name: 'Katsu Curry', price: 195 },
  { name: 'Biscoff Latte', price: 160 },
  { name: 'Chicken Sandwich', price: 145 },
  { name: 'Red Velvet Slice', price: 150 },
]
const sampleTotal = sampleReceiptItems.reduce((total, item) => total + item.price, 0)

// Decorative sample only: no customer, payment, or live order data is loaded here.
function SampleOrderReceipt() {
  return <div className="order-sample-receipt">
    <div className="order-sample-receipt-heading">
      <img src="/images/coffeerealmlogo.png" alt="" width="44" height="44" />
      <strong>THE COFFEE REALM</strong>
      <span className="order-sample-receipt-label">SAMPLE RECEIPT</span>
    </div>
    <div className="order-sample-receipt-rule" />
    <div className="order-sample-receipt-row"><span>Order #:</span><span>SAMPLE-001</span></div>
    <div className="order-sample-receipt-row"><span>Type:</span><span>Online / Pickup</span></div>
    <div className="order-sample-receipt-rule" />
    <div className="order-sample-receipt-item order-sample-receipt-columns"><span>QTY</span><span>ITEM</span><span>PHP</span></div>
    {sampleReceiptItems.map((item) => <div className="order-sample-receipt-item" key={item.name}><span>1</span><span>{item.name}</span><span>{item.price.toFixed(2)}</span></div>)}
    <div className="order-sample-receipt-rule" />
    <div className="order-sample-receipt-row"><span>VATable Sale:</span><span>{(sampleTotal / 1.12).toFixed(2)}</span></div>
    <div className="order-sample-receipt-row"><span>12% VAT:</span><span>{(sampleTotal - sampleTotal / 1.12).toFixed(2)}</span></div>
    <div className="order-sample-receipt-row order-sample-receipt-total"><strong>TOTAL</strong><strong>PHP {sampleTotal.toFixed(2)}</strong></div>
    <div className="order-sample-receipt-rule" />
    <div className="order-sample-receipt-row"><span>Payment:</span><span>Cash</span></div>
    <div className="order-sample-receipt-rule" />
    <div className="order-sample-receipt-thanks">Thank you for choosing<br />The Coffee Realm.</div>
  </div>
}

function OrderFoodScene({ step, enabled }) {
  const transition = { duration: enabled ? .5 : 0, ease: [.22, 1, .36, 1] }
  return <div className="order-food-scene" data-step={step + 1}>
    <div className="order-food-halo" />
    <div className="order-food-composition">
    <motion.div className="order-food-tray" initial={false}
      animate={{ opacity: step === 1 ? 1 : 0, scale: step === 1 ? 1 : .94, y: step === 1 ? 0 : 12 }} transition={transition}>
      <img src="/images/ordering/cafe-serving-tray.webp" alt="" width="1774" height="887" decoding="async" draggable={false} />
    </motion.div>
    {foods.map((food) => {
      const pose = step === 0 ? food.floating : food.settled
      return <motion.div key={food.key} className={`order-food-item order-food-item-${food.key}`} initial={false}
        animate={{ left: pose.x, top: pose.y, width: pose.width, rotate: pose.rotate, scaleY: pose.scaleY ?? 1, opacity: step < 2 ? 1 : 0 }} transition={transition}>
        <img src={`/images/ordering/${food.image}`} alt="" width={food.imageWidth} height={food.height} loading="eager" decoding="async" draggable={false} />
      </motion.div>
    })}
    </div>
    <motion.div className="order-receipt-scene" initial={false}
      animate={{ opacity: step === 2 ? 1 : 0, y: step === 2 ? 0 : 16, rotate: step === 2 ? -5 : -2 }} transition={transition}>
      <SampleOrderReceipt />
    </motion.div>
    <motion.div className="order-bag-scene" initial={false}
      animate={{ opacity: step === 3 ? 1 : 0, y: step === 3 ? 0 : 18, scale: step === 3 ? 1 : .96 }} transition={transition}>
      <img src="/images/ordering/tcr-takeaway-bag.webp" alt="" width="1024" height="1536" decoding="async" draggable={false} />
    </motion.div>
  </div>
}
export default function HowOrderingWorks() {
  const [active, setActive] = useState(0)
  const { enabled, canHover } = useRealmMotion()
  return <section className="order-journey" aria-labelledby="ordering-works-title">
    <header className="order-journey-heading">
      <h2 id="ordering-works-title">How ordering works<br /><em>Just four steps away.</em></h2>
    </header>
    <div className="order-ticket">
      <div className="order-ticket-scene" aria-hidden="true">
        <div className="order-ticket-art">
          <OrderFoodScene step={active} enabled={enabled} />
        </div>
      </div>
      <div className="order-ticket-details">
        <ol className="order-ticket-steps">
          {steps.map((step, index) => <li key={step.title}>
            <button type="button" className="order-ticket-step" data-active={index === active} aria-pressed={index === active} onClick={() => setActive(index)} onFocus={() => setActive(index)} onMouseEnter={() => { if (canHover) setActive(index) }}>
              <span className="order-ticket-number">0{index + 1}</span>
              <span className="order-ticket-copy"><strong>{step.title}</strong><span>{step.description}</span></span>
              <span className="order-ticket-step-arrow" aria-hidden="true">{index === 3 ? <Check size={17} /> : <ArrowRight size={17} />}</span>
            </button>
          </li>)}
        </ol>
        <Link className="order-ticket-cta" to="/menu">Start your order <ArrowRight size={18} aria-hidden="true" /></Link>
      </div>
    </div>
  </section>
}
