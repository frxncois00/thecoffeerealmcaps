import { motion } from 'framer-motion'
import { useRealmMotion } from '../../motion/useRealmMotion'
import { landingRevealVariants } from '../../motion/config'

export default function LandingReveal({ children, delay = 0, y = 48, tag = 'div', ...props }) {
  const MotionTag = motion[tag] || motion.div
  const { enabled } = useRealmMotion()
  const variants = landingRevealVariants(enabled, y)
  variants.show.transition.delay = enabled ? delay : 0
  return <MotionTag initial={enabled ? 'hidden' : false} whileInView="show"
    viewport={{ once: true, amount: 'some', margin: '0px 0px -40px 0px' }}
    variants={variants} {...props}>{children}</MotionTag>
}
