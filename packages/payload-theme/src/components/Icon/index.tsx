'use client'

import type { IconName } from 'lucide-react/dynamic'

import { Icon as LucideIcon } from 'lucide-react'
import { dynamicIconImports } from 'lucide-react/dynamic'
import React from 'react'

export type { IconName }

/** lucide's icon geometry: `[element, attributes][]`, fed to its renderer. */
type IconNode = React.ComponentProps<typeof LucideIcon>['iconNode']

/**
 * Icon geometry already pulled off the network, kept at MODULE scope so it
 * outlives the component tree.
 *
 * Payload renders the nav (and the whole view) inside `DefaultTemplate`, which
 * belongs to the page — not the layout — so every admin navigation remounts
 * it. lucide's own `DynamicIcon` re-resolves its icon in an effect and renders
 * `null` until that promise settles, which blanked every icon for a frame on
 * each navigation: the sidebar visibly flickered and its labels jumped left.
 * Cached here, the second and later mounts render synchronously — the first
 * paint after a navigation is already correct.
 */
const loaded = new Map<string, IconNode>()

/** In-flight (or settled) imports, so N icons of one name share a single load. */
const loading = new Map<string, Promise<void>>()

const load = (name: string): Promise<void> => {
  const existing = loading.get(name)
  if (existing) return existing

  const importer = dynamicIconImports[name as IconName]
  const promise = importer
    ? importer()
        .then((mod) => {
          loaded.set(name, mod.__iconNode as IconNode)
        })
        .catch(() => {
          // Chunk failed to load: keep the placeholder rather than taking the
          // whole panel down over an icon.
        })
    : Promise.resolve()

  loading.set(name, promise)
  return promise
}

export type IconProps = {
  name: IconName | string
} & Omit<React.SVGProps<SVGSVGElement>, 'name'>

/**
 * Drop-in replacement for lucide's `DynamicIcon`: same props, same per-icon
 * lazy chunk, but loaded icons are cached across mounts and the pending state
 * is an empty box of the right size instead of nothing, so labels beside an
 * icon never shift while it loads.
 */
export const Icon: React.FC<IconProps> = ({ name, ...rest }) => {
  const iconNode = loaded.get(name)
  const [, rerender] = React.useReducer((count: number) => count + 1, 0)

  React.useEffect(() => {
    if (loaded.has(name)) return

    let active = true
    void load(name).then(() => {
      if (active) rerender()
    })
    return () => {
      active = false
    }
  }, [name])

  if (iconNode) return <LucideIcon {...rest} iconNode={iconNode} />

  // Same geometry as a rendered lucide icon (24×24 viewBox, 24px default box),
  // so any CSS sizing the `svg` applies to the placeholder identically.
  return (
    <svg
      {...rest}
      aria-hidden="true"
      fill="none"
      height={rest.height ?? 24}
      viewBox="0 0 24 24"
      width={rest.width ?? 24}
      xmlns="http://www.w3.org/2000/svg"
    />
  )
}

export default Icon
