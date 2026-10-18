// PERF: deterministic sampler, separate from rendering for repeatable tests.
// Two slow windows plus a cooldown prevent quality oscillation. A reset discards
// hidden-tab time, which browsers intentionally throttle below display refresh.
export function createFrameBudget(onSlow) {
  let start = null, frames = 0, slowWindows = 0, cooldown = 0
  return {
    reset() { start = null; frames = 0; slowWindows = 0 },
    sample(now) {
      if (start === null) start = now
      frames++
      if (now - start < 2000) return
      const fps = (frames - 1) * 1000 / (now - start)
      slowWindows = fps < 45 ? slowWindows + 1 : 0
      if (slowWindows >= 2 && now >= cooldown) {
        onSlow()
        slowWindows = 0
        cooldown = now + 10000
      }
      start = now; frames = 0
    },
  }
}
