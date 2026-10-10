import { motion } from 'framer-motion'
import { useRealmMotion } from '../motion/useRealmMotion'
import { motionTokens } from '../motion/config'

export default function Reveal({ children, delay = 0, y = 28, tag = 'div', className = '', ...rest }) {
  const MotionTag = motion[tag] || motion.div
  const { enabled } = useRealmMotion()
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: enabled ? y : 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: enabled ? motionTokens.duration.reveal : motionTokens.duration.fast, delay: enabled ? delay : 0, ease: motionTokens.ease }}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}
