/**
 * Locale code → flag region, split out of the component so the mapping can be
 * unit-tested without a React tree.
 *
 * Payload locale codes are whatever the project configured: a bare language
 * (`tr`), a language+region tag (`pt-BR`, `en_US`), or something with a script
 * in the middle (`zh-Hant-TW`). A flag is a REGION, not a language, so an
 * explicit region subtag always wins; only when there is none do we fall back
 * to the country conventionally associated with the language.
 *
 * That fallback is a convention, not a fact — `en` is not the United Kingdom
 * and `ar` is not Saudi Arabia. It exists so the common single-language setup
 * gets a flag at all; projects that care about the distinction should spell the
 * region out (`en-US`), which this respects.
 */

/** Language subtag → the region whose flag stands in for it. */
const LANGUAGE_REGION: Record<string, string> = {
  ar: 'SA',
  az: 'AZ',
  bg: 'BG',
  bs: 'BA',
  ca: 'ES',
  cs: 'CZ',
  da: 'DK',
  de: 'DE',
  el: 'GR',
  en: 'GB',
  es: 'ES',
  et: 'EE',
  fa: 'IR',
  fi: 'FI',
  fr: 'FR',
  he: 'IL',
  hi: 'IN',
  hr: 'HR',
  hu: 'HU',
  hy: 'AM',
  id: 'ID',
  is: 'IS',
  it: 'IT',
  ja: 'JP',
  ka: 'GE',
  ko: 'KR',
  lt: 'LT',
  lv: 'LV',
  mk: 'MK',
  ms: 'MY',
  nb: 'NO',
  nl: 'NL',
  nn: 'NO',
  no: 'NO',
  pl: 'PL',
  pt: 'PT',
  ro: 'RO',
  ru: 'RU',
  sk: 'SK',
  sl: 'SI',
  sq: 'AL',
  sr: 'RS',
  sv: 'SE',
  th: 'TH',
  tr: 'TR',
  uk: 'UA',
  ur: 'PK',
  vi: 'VN',
  zh: 'CN',
}

/**
 * Payload ships a few admin-language keys that aren't plain BCP-47 tags
 * (camelCase script variants, plus `rs`/`rsLatin` for Serbian). They only turn
 * up if a project reuses those keys as locale codes, but the cost of handling
 * them is two lines.
 */
const EXACT_REGION: Record<string, string> = {
  rs: 'RS',
  rslatin: 'RS',
  zhtw: 'TW',
}

/**
 * Resolve a locale code to a two-letter region code, or `undefined` when
 * nothing sensible maps (the caller then shows the code badge alone).
 */
export const localeToRegion = (code: string): string | undefined => {
  if (typeof code !== 'string') return undefined

  const trimmed = code.trim()
  if (!trimmed) return undefined

  const exact = EXACT_REGION[trimmed.toLowerCase()]
  if (exact) return exact

  const parts = trimmed.replace(/_/g, '-').split('-').filter(Boolean)
  if (parts.length === 0) return undefined

  // An explicit region subtag wins over the language convention. Scan from the
  // right so `zh-Hant-TW` lands on TW and the 4-letter script is skipped.
  for (let index = parts.length - 1; index >= 1; index -= 1) {
    if (/^[A-Za-z]{2}$/.test(parts[index])) return parts[index].toUpperCase()
  }

  return LANGUAGE_REGION[parts[0].toLowerCase()]
}
