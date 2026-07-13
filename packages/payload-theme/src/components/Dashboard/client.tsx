'use client'

/**
 * Client-side leaf of the (server) Dashboard: the animated stat-card counter.
 * Renders the final value on the server and only animates after mount, so
 * there is no hydration mismatch.
 */

import React from 'react'

const reducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Animated count-up for the stat cards. Renders the final value immediately
 * when the user prefers reduced motion (and on the server). */
export const CountUp: React.FC<{ value: number }> = ({ value }) => {
  const [display, setDisplay] = React.useState(value)

  // No "ran once" ref: StrictMode mounts effects twice, and a ref guard would
  // let the first (cancelled) run block the real one — freezing the count at 0.
  React.useEffect(() => {
    if (value === 0 || reducedMotion()) {
      setDisplay(value)
      return
    }

    const duration = 650
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(value * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    setDisplay(0)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return <span suppressHydrationWarning>{display.toLocaleString('en-US')}</span>
}
