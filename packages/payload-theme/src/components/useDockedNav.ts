'use client'

import { useNav, usePreferences } from '@payloadcms/ui'
import React from 'react'

import { dockedBandQuery, drawerQuery } from '../theme/index.js'

/** SSR-safe layout effect: the fixes below must land before the browser paints,
 * but the Nav is server-rendered too and `useLayoutEffect` warns there. */
export const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

/**
 * Whether the user wants the docked sidebar open. `undefined` until known.
 *
 * Module scope on purpose: the Nav remounts on every navigation (it renders
 * inside the page's template), while the choice must outlive it. A full page
 * load starts over from the saved `nav` preference.
 */
let sidebarWish: boolean | undefined

/** Record an explicit open/collapse (the header chip), so it is never undone. */
export const rememberSidebarWish = (open: boolean): void => {
  sidebarWish = open
}

/**
 * Keeps the sidebar docked and open in the `nav.dockedMinWidth` band.
 *
 * Payload's `NavProvider` closes the nav on mount and on every breakpoint
 * change at 1440px and below, whatever the saved preference says (it only
 * reads the preference above 1440px). Inside the band that close is undone as
 * soon as it lands, unless the user collapsed the sidebar themselves or saved
 * it closed. Because the undo runs in a layout effect, React re-renders before
 * the browser paints the closed state.
 *
 * Leaving the band downward hands the nav back to the drawer: closed, so it
 * does not pop up as an overlay when the window shrinks.
 */
export const useDockedNav = (dockedMinWidth: null | number): void => {
  const { hydrated, navOpen, setNavOpen } = useNav()
  const { getPreference } = usePreferences()
  const [inBand, setInBand] = React.useState(false)
  const [wishKnown, setWishKnown] = React.useState(sidebarWish !== undefined)
  const wasInBand = React.useRef(false)

  useIsomorphicLayoutEffect(() => {
    if (dockedMinWidth === null) return
    const query = window.matchMedia(dockedBandQuery(dockedMinWidth))
    const sync = () => setInBand(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [dockedMinWidth])

  useIsomorphicLayoutEffect(() => {
    if (dockedMinWidth === null || sidebarWish !== undefined) return
    if (!hydrated) {
      // First render of a page load: `navOpen` is still the server's reading of
      // the saved preference, Payload has not closed it yet.
      sidebarWish = navOpen
      setWishKnown(true)
      return
    }
    // The Nav mounted late (a client-side jump from the login view): ask for it.
    const settle = (open: boolean) => {
      if (sidebarWish === undefined) sidebarWish = open
      setWishKnown(true)
    }
    getPreference<null | { open?: boolean }>('nav').then(
      (preference) => settle(preference?.open !== false),
      () => settle(true),
    )
  }, [dockedMinWidth, getPreference, hydrated, navOpen])

  useIsomorphicLayoutEffect(() => {
    if (!hydrated || !inBand || !wishKnown || navOpen || sidebarWish === false) return
    setNavOpen(true)
  }, [hydrated, inBand, navOpen, setNavOpen, wishKnown])

  useIsomorphicLayoutEffect(() => {
    if (wasInBand.current && !inBand && window.matchMedia(drawerQuery(dockedMinWidth)).matches) {
      setNavOpen(false)
    }
    wasInBand.current = inBand
  }, [dockedMinWidth, inBand, setNavOpen])
}
