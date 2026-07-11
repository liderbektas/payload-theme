'use client'

/**
 * Client-side leaves of the (server) Dashboard: anything that depends on the
 * viewer's clock or needs animation. Each renders a stable server-safe
 * fallback first and upgrades after mount, so there is no hydration mismatch
 * from timezones.
 */

import React from 'react'

const reducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Time-of-day greeting, computed on the viewer's clock after mount. */
export const Greeting: React.FC<{ name?: string }> = ({ name }) => {
  const [greeting, setGreeting] = React.useState<null | string>(null)

  React.useEffect(() => {
    const hour = new Date().getHours()
    setGreeting(hour < 5 ? 'Working late' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening')
  }, [])

  return (
    <span>
      {greeting ?? 'Welcome back'}
      {name ? `, ${name}` : ''}
    </span>
  )
}

/** Today's date in the viewer's locale/timezone; empty until mounted. */
export const TodayDate: React.FC = () => {
  const [date, setDate] = React.useState('')

  React.useEffect(() => {
    setDate(new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(new Date()))
  }, [])

  return <span suppressHydrationWarning>{date}</span>
}

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

/** "5m ago" style relative time, computed on the viewer's clock after mount.
 * Falls back to a locale date string so the row is never blank pre-mount. */
export const TimeAgo: React.FC<{ iso: string }> = ({ iso }) => {
  const [label, setLabel] = React.useState<null | string>(null)

  React.useEffect(() => {
    const then = new Date(iso).getTime()
    if (Number.isNaN(then)) return
    const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000))
    if (seconds < 60) setLabel('just now')
    else if (seconds < 3600) setLabel(`${Math.floor(seconds / 60)}m ago`)
    else if (seconds < 86400) setLabel(`${Math.floor(seconds / 3600)}h ago`)
    else if (seconds < 86400 * 7) setLabel(`${Math.floor(seconds / 86400)}d ago`)
    else setLabel(new Date(then).toLocaleDateString())
  }, [iso])

  return <span suppressHydrationWarning>{label ?? ''}</span>
}
