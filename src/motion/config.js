// The single kill switch for all non-essential landing-page motion.
export const MOTION_ENABLED = true

export const motionTokens = {
  ease: [0.22, 1, 0.36, 1],
  duration: { fast: 0.18, base: 0.45, reveal: 0.7 },
  stagger: 0.1,
}

export const revealVariants = (enabled, distance = 24) => ({
  hidden: { opacity: 0, y: enabled ? distance : 0 },
  show: { opacity: 1, y: 0, transition: {
    duration: enabled ? motionTokens.duration.reveal : motionTokens.duration.fast,
    ease: motionTokens.ease,
  } },
})
