'use client'

import React from 'react'

/**
 * Example CLIENT widget for the playground: plain 'use client' component,
 * no props — anything interactive works. Referenced from payload.config.ts
 * by its import-map path, exactly like the server widget next to it.
 */
export const LocalTimeWidget: React.FC = () => {
  const [now, setNow] = React.useState<null | Date>(null)

  React.useEffect(() => {
    setNow(new Date())
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <article className="pt-dash__card">
      <div className="pt-dash__card-head">
        <span className="pt-dash__card-label">Local time</span>
      </div>
      <div className="pt-dash__card-body">
        <span className="pt-dash__card-count" suppressHydrationWarning>
          {now ? now.toLocaleTimeString() : '—'}
        </span>
        <span className="pt-dash__card-caption">ticking client-side</span>
      </div>
    </article>
  )
}

export default LocalTimeWidget
