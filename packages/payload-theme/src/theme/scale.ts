/**
 * Accent -> 11-step scale (50..950).
 *
 * Strategy: identity-preserving. The seed sits at step 500 with its own hue,
 * chroma, and lightness; tints (50..400) interpolate its lightness toward white
 * and shades (600..950) toward near-black. This keeps the accent recognizable
 * across the whole scale — a yellow accent stays yellow (and so takes black
 * contrast text) instead of collapsing into a muddy brown, which a fixed
 * lightness ramp would force on high-luminance hues.
 *
 * A very light or very dark accent is nudged into a usable lightness band for
 * the 500 anchor so both the tint and shade sides keep enough room to breathe;
 * hue and chroma are always preserved. Hue is held constant across steps for
 * predictability, and chroma follows a curve that peaks at 500 and tapers
 * toward both ends so tints and shades read clean rather than neon or muddy.
 */

import { oklchToHex, type OKLCH } from './oklch'

export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

export type ScaleStep = (typeof SCALE_STEPS)[number]

/** A full 50..950 scale as `#rrggbb` hex strings. */
export type Scale = Record<ScaleStep, string>

/** Lightness the lightest tint (50) approaches. */
const L_MAX = 0.985
/** Lightness the darkest shade (950) approaches. */
const L_MIN = 0.17
/** The 500 anchor is kept inside this band so both ramp sides stay usable. */
const ANCHOR_MIN = 0.45
const ANCHOR_MAX = 0.82

/**
 * How far each step travels from the 500 anchor toward its ramp endpoint
 * (0 = at the anchor, 1 = at the endpoint). Steps below 500 head toward
 * `L_MAX`, steps above toward `L_MIN`; the eased spacing keeps steps visually
 * even. Step 500 has reach 0, so it lands exactly on the anchor.
 */
const REACH: Record<ScaleStep, number> = {
  50: 0.97,
  100: 0.88,
  200: 0.72,
  300: 0.52,
  400: 0.3,
  500: 0,
  600: 0.2,
  700: 0.38,
  800: 0.56,
  900: 0.7,
  950: 0.9,
}

/** Per-step multiplier applied to the seed chroma; peaks at the 500 anchor. */
const CHROMA_CURVE: Record<ScaleStep, number> = {
  50: 0.2,
  100: 0.34,
  200: 0.55,
  300: 0.75,
  400: 0.9,
  500: 1.0,
  600: 0.94,
  700: 0.86,
  800: 0.76,
  900: 0.66,
  950: 0.52,
}

const clamp = (n: number, lo: number, hi: number): number => (n < lo ? lo : n > hi ? hi : n)

function lightnessForStep(step: ScaleStep, anchorL: number): number {
  const reach = REACH[step]
  return step < 500 ? anchorL + reach * (L_MAX - anchorL) : anchorL - reach * (anchorL - L_MIN)
}

/**
 * Build the OKLCH color for each step from a seed. Returned in `SCALE_STEPS`
 * order (50 first). Lightness is strictly decreasing by construction.
 */
export function generateScaleOklch(seed: OKLCH): Record<ScaleStep, OKLCH> {
  const anchorL = clamp(seed.L, ANCHOR_MIN, ANCHOR_MAX)
  const out = {} as Record<ScaleStep, OKLCH>
  for (const step of SCALE_STEPS) {
    out[step] = {
      L: lightnessForStep(step, anchorL),
      C: seed.C * CHROMA_CURVE[step],
      H: seed.H,
    }
  }
  return out
}

/** Build the 50..950 scale as gamut-mapped hex strings from a seed OKLCH. */
export function generateScale(seed: OKLCH): Scale {
  const oklch = generateScaleOklch(seed)
  const out = {} as Scale
  for (const step of SCALE_STEPS) {
    out[step] = oklchToHex(oklch[step])
  }
  return out
}
