/**
 * Color-space conversions for the theme engine.
 *
 * Pipeline: hex <-> sRGB (0..1) <-> linear sRGB <-> OKLab <-> OKLCH.
 *
 * OKLCH is our working space because it separates perceptual lightness (L)
 * from chroma (C) and hue (H) on independent axes, so a lightness ramp reads
 * as visually even and hue stays stable as we lighten/darken. Math is Björn
 * Ottosson's OKLab (https://bottosson.github.io/posts/oklab/); zero runtime deps.
 */

/** sRGB channels, each normalized to 0..1. */
export interface RGB {
  r: number
  g: number
  b: number
}

/** OKLCH: L in 0..1 (lightness), C >= 0 (chroma), H in 0..360 degrees (hue). */
export interface OKLCH {
  L: number
  C: number
  H: number
}

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n)

/* ------------------------------------------------------------------ *
 * hex <-> sRGB (0..1)
 * ------------------------------------------------------------------ */

/**
 * Parse a hex color into 0..1 sRGB channels. Accepts `#rgb`, `#rrggbb`,
 * with or without a leading `#`, case-insensitive. Returns `null` for any
 * input that is not one of those two shapes.
 */
export function hexToRgb(hex: string): RGB | null {
  if (typeof hex !== 'string') return null
  let h = hex.trim().toLowerCase()
  if (h.startsWith('#')) h = h.slice(1)

  if (h.length === 3) {
    if (!/^[0-9a-f]{3}$/.test(h)) return null
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  } else if (h.length === 6) {
    if (!/^[0-9a-f]{6}$/.test(h)) return null
  } else {
    return null
  }

  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  }
}

const channelToHex = (c: number): string =>
  Math.round(clamp01(c) * 255)
    .toString(16)
    .padStart(2, '0')

/** Serialize 0..1 sRGB channels to a lowercase `#rrggbb` string (clamped). */
export function rgbToHex({ r, g, b }: RGB): string {
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`
}

/* ------------------------------------------------------------------ *
 * sRGB <-> linear sRGB (gamma)
 * ------------------------------------------------------------------ */

/** sRGB gamma decode: one 0..1 channel to linear light. */
export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** sRGB gamma encode: one linear-light channel back to 0..1 sRGB. */
export function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

/* ------------------------------------------------------------------ *
 * linear sRGB <-> OKLab <-> OKLCH
 * ------------------------------------------------------------------ */

interface OKLab {
  L: number
  a: number
  b: number
}

function linearRgbToOklab(r: number, g: number, b: number): OKLab {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b

  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  }
}

function oklabToLinearRgb({ L, a, b }: OKLab): RGB {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  }
}

/** Convert 0..1 sRGB to OKLCH. */
export function rgbToOklch({ r, g, b }: RGB): OKLCH {
  const lab = linearRgbToOklab(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b))
  const C = Math.hypot(lab.a, lab.b)
  let H = (Math.atan2(lab.b, lab.a) * 180) / Math.PI
  if (H < 0) H += 360
  return { L: lab.L, C, H }
}

/**
 * Convert OKLCH to 0..1 sRGB **without** gamut handling. Channels may fall
 * outside 0..1 when the color is not representable in sRGB; callers that need
 * a displayable color should use {@link oklchToRgbGamut} instead.
 */
export function oklchToRgbRaw({ L, C, H }: OKLCH): RGB {
  const hRad = (H * Math.PI) / 180
  return oklabToLinearRgb({ L, a: C * Math.cos(hRad), b: C * Math.sin(hRad) })
}

const EPSILON = 1e-7

/** True when all linear-RGB channels sit within the sRGB gamut (0..1). */
function inGamut({ r, g, b }: RGB): boolean {
  return (
    r >= -EPSILON &&
    r <= 1 + EPSILON &&
    g >= -EPSILON &&
    g <= 1 + EPSILON &&
    b >= -EPSILON &&
    b <= 1 + EPSILON
  )
}

/**
 * Convert OKLCH to displayable 0..1 sRGB, reducing chroma until the color fits
 * the sRGB gamut. Lightness and hue are preserved; only saturation is lowered
 * (via binary search), which avoids the hue shifts that naive RGB clamping
 * produces at the light and dark ends of a scale.
 */
export function oklchToRgbGamut(color: OKLCH): RGB {
  const direct = oklchToRgbLinearClamped(color)
  if (direct.inGamut) return direct.rgb

  let lo = 0
  let hi = color.C
  // ~20 iterations resolves chroma to well under one 8-bit step.
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2
    const linear = oklchToRgbRaw({ L: color.L, C: mid, H: color.H })
    if (inGamut(linear)) lo = mid
    else hi = mid
  }
  return oklchToRgbLinearClamped({ L: color.L, C: lo, H: color.H }).rgb
}

/** Convert OKLCH to sRGB, gamma-encoding and clamping any tiny overshoot. */
function oklchToRgbLinearClamped(color: OKLCH): { rgb: RGB; inGamut: boolean } {
  const linear = oklchToRgbRaw(color)
  return {
    inGamut: inGamut(linear),
    rgb: {
      r: clamp01(linearToSrgb(clamp01(linear.r))),
      g: clamp01(linearToSrgb(clamp01(linear.g))),
      b: clamp01(linearToSrgb(clamp01(linear.b))),
    },
  }
}

/** Convenience: parse a hex string straight to OKLCH (null if invalid). */
export function hexToOklch(hex: string): OKLCH | null {
  const rgb = hexToRgb(hex)
  return rgb ? rgbToOklch(rgb) : null
}

/** Convenience: OKLCH to a displayable `#rrggbb` hex (gamut-mapped). */
export function oklchToHex(color: OKLCH): string {
  return rgbToHex(oklchToRgbGamut(color))
}
