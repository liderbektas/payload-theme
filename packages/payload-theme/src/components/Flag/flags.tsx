'use client'

import React from 'react'

/**
 * Flag geometry, drawn inline on a shared 24 × 18 canvas.
 *
 * Inline rather than emoji on purpose: Windows ships no flag glyphs, so
 * `🇹🇷` renders there as the bare letters "TR" — and Windows is exactly where
 * this menu gets used. Inline rather than an image sprite for the same reason
 * the icons are inline: no extra request, no CSP surface, and both themes get
 * the same crisp 20px mark.
 *
 * These are SIMPLIFIED marks, not heraldry. At 20 × 15 a coat of arms is three
 * muddy pixels, so emblems are reduced to the shape that still reads at that
 * size (Portugal's armillary is a ring, Mexico's eagle a disc). Anything that
 * would be indistinguishable from its neighbour keeps just enough of its
 * emblem to tell them apart — Slovakia, Slovenia and Russia share a
 * white/blue/red field and would otherwise be one flag drawn three times.
 */

/** Equal-height horizontal bands, top to bottom. */
const horizontal = (...colors: string[]): React.ReactNode => {
  const height = 18 / colors.length
  return colors.map((color, index) => (
    <rect fill={color} height={height} key={index} width="24" x="0" y={height * index} />
  ))
}

/** Equal-width vertical bands, left to right. */
const vertical = (...colors: string[]): React.ReactNode => {
  const width = 24 / colors.length
  return colors.map((color, index) => (
    <rect fill={color} height="18" key={index} width={width} x={width * index} y="0" />
  ))
}

/** Off-centre Nordic cross, with an optional inner stripe (Norway, Iceland). */
const nordic = (field: string, cross: string, inner?: string): React.ReactNode => (
  <React.Fragment>
    <rect fill={field} height="18" width="24" x="0" y="0" />
    <rect fill={cross} height="18" width="4" x="7" y="0" />
    <rect fill={cross} height="4" width="24" x="0" y="7" />
    {inner ? (
      <React.Fragment>
        <rect fill={inner} height="18" width="1.6" x="8.2" y="0" />
        <rect fill={inner} height="1.6" width="24" x="0" y="8.2" />
      </React.Fragment>
    ) : null}
  </React.Fragment>
)

/** Five-pointed star, point up unless rotated (radians). */
const star = (
  cx: number,
  cy: number,
  radius: number,
  fill: string,
  rotation = 0,
): React.ReactNode => {
  const points: string[] = []
  for (let index = 0; index < 5; index += 1) {
    const outer = rotation + (index * 2 * Math.PI) / 5 - Math.PI / 2
    const inner = outer + Math.PI / 5
    points.push(
      `${(cx + radius * Math.cos(outer)).toFixed(2)},${(cy + radius * Math.sin(outer)).toFixed(2)}`,
      `${(cx + radius * 0.382 * Math.cos(inner)).toFixed(2)},${(cy + radius * 0.382 * Math.sin(inner)).toFixed(2)}`,
    )
  }
  return <polygon fill={fill} points={points.join(' ')} />
}

/** Many-rayed sun (Taiwan): a disc with triangular teeth around it. */
const sunburst = (cx: number, cy: number, radius: number, fill: string): React.ReactNode => {
  const teeth: string[] = []
  for (let index = 0; index < 12; index += 1) {
    const angle = (index * 2 * Math.PI) / 12
    const half = Math.PI / 24
    teeth.push(
      [
        `${(cx + radius * 1.9 * Math.cos(angle)).toFixed(2)},${(cy + radius * 1.9 * Math.sin(angle)).toFixed(2)}`,
        `${(cx + radius * Math.cos(angle - half)).toFixed(2)},${(cy + radius * Math.sin(angle - half)).toFixed(2)}`,
        `${(cx + radius * Math.cos(angle + half)).toFixed(2)},${(cy + radius * Math.sin(angle + half)).toFixed(2)}`,
      ].join(' '),
    )
  }
  return (
    <React.Fragment>
      {teeth.map((points, index) => (
        <polygon fill={fill} key={index} points={points} />
      ))}
      <circle cx={cx} cy={cy} fill={fill} r={radius} />
    </React.Fragment>
  )
}

/** Crescent + star, the Turkish/Azerbaijani arrangement. */
const crescent = (
  cx: number,
  cy: number,
  radius: number,
  mark: string,
  field: string,
): React.ReactNode => (
  <React.Fragment>
    <circle cx={cx} cy={cy} fill={mark} r={radius} />
    <circle cx={cx + radius * 0.35} cy={cy} fill={field} r={radius * 0.8} />
    {star(cx + radius * 1.35, cy, radius * 0.49, mark)}
  </React.Fragment>
)

/** The Union flag, reused at half scale inside the Australian canton. */
const unionFlag = (
  <React.Fragment>
    <rect fill="#012169" height="18" width="24" x="0" y="0" />
    <path d="M0,0 L24,18 M24,0 L0,18" fill="none" stroke="#FFFFFF" strokeWidth="3.6" />
    <path d="M0,0 L24,18 M24,0 L0,18" fill="none" stroke="#C8102E" strokeWidth="1.7" />
    <path d="M12,0 V18 M0,9 H24" fill="none" stroke="#FFFFFF" strokeWidth="6" />
    <path d="M12,0 V18 M0,9 H24" fill="none" stroke="#C8102E" strokeWidth="3.4" />
  </React.Fragment>
)

/** Three stacked bars, rotated — one Korean trigram, simplified to solid. */
const trigram = (cx: number, cy: number, degrees: number): React.ReactNode => (
  <g transform={`rotate(${degrees} ${cx} ${cy})`}>
    {[-1, 0, 1].map((offset) => (
      <rect
        fill="#000000"
        height="0.62"
        key={offset}
        width="3.4"
        x={cx - 1.7}
        y={cy + offset * 0.95 - 0.31}
      />
    ))}
  </g>
)

/**
 * Region code → geometry. Functions, not elements, so only the flags actually
 * on screen are built.
 */
export const FLAGS: Record<string, () => React.ReactNode> = {
  AL: () => (
    <React.Fragment>
      <rect fill="#E41E20" height="18" width="24" x="0" y="0" />
      {/* The double-headed eagle, reduced to its silhouette: two head notches
       * on top of a spread-winged body. Feathers are not a 20px shape. */}
      <path
        d="M9.6,4.8 L11,6.4 L11.6,5.5 L12.4,5.5 L13,6.4 L14.4,4.8 L14.1,7 L16.7,7.6 L14.7,8.9 L16.5,10.8 L13.6,10.5 L13.4,12.7 L12,11.5 L10.6,12.7 L10.4,10.5 L7.5,10.8 L9.3,8.9 L7.3,7.6 L9.9,7 Z"
        fill="#000000"
      />
    </React.Fragment>
  ),
  AM: () => horizontal('#D90012', '#0033A0', '#F2A800'),
  AT: () => horizontal('#ED2939', '#FFFFFF', '#ED2939'),
  AU: () => (
    <React.Fragment>
      <rect fill="#00247D" height="18" width="24" x="0" y="0" />
      <g transform="scale(0.5)">{unionFlag}</g>
      {star(6, 14.4, 1.9, '#FFFFFF')}
      {star(17.4, 4.4, 1.1, '#FFFFFF')}
      {star(20.4, 8.6, 1.1, '#FFFFFF')}
      {star(17.6, 13.2, 1.1, '#FFFFFF')}
      {star(14.6, 8.2, 0.8, '#FFFFFF')}
    </React.Fragment>
  ),
  AZ: () => (
    <React.Fragment>
      {horizontal('#00B5E2', '#EF3340', '#509E2F')}
      {crescent(11, 9, 2.1, '#FFFFFF', '#EF3340')}
    </React.Fragment>
  ),
  BA: () => (
    <React.Fragment>
      <rect fill="#002F6C" height="18" width="24" x="0" y="0" />
      <path d="M7.5,0 L20,0 L20,18 Z" fill="#FECB00" />
      {[0, 1, 2, 3, 4].map((index) => (
        <React.Fragment key={index}>
          {star(6.6 + index * 2.4, 2.2 + index * 3.4, 1, '#FFFFFF')}
        </React.Fragment>
      ))}
    </React.Fragment>
  ),
  BE: () => vertical('#000000', '#FAE042', '#ED2939'),
  BG: () => horizontal('#FFFFFF', '#00966E', '#D62612'),
  BR: () => (
    <React.Fragment>
      <rect fill="#009C3B" height="18" width="24" x="0" y="0" />
      <path d="M12,2 L21.8,9 L12,16 L2.2,9 Z" fill="#FFDF00" />
      <circle cx="12" cy="9" fill="#002776" r="3.5" />
      <path d="M8.9,7.9 A5.4,5.4 0 0,1 15.1,7.6" fill="none" stroke="#FFFFFF" strokeWidth="1" />
    </React.Fragment>
  ),
  CA: () => (
    <React.Fragment>
      <rect fill="#FFFFFF" height="18" width="24" x="0" y="0" />
      <rect fill="#D80621" height="18" width="6" x="0" y="0" />
      <rect fill="#D80621" height="18" width="6" x="18" y="0" />
      <path
        d="M12,3.6 L12.9,6.2 L14.6,5.4 L14,7.8 L16.4,7.4 L15.2,8.7 L16.6,9.6 L13.3,10.1 L13.7,11.6 L12.4,11.2 L12.6,14.4 L11.4,14.4 L11.6,11.2 L10.3,11.6 L10.7,10.1 L7.4,9.6 L8.8,8.7 L7.6,7.4 L10,7.8 L9.4,5.4 L11.1,6.2 Z"
        fill="#D80621"
      />
    </React.Fragment>
  ),
  CH: () => (
    <React.Fragment>
      <rect fill="#D52B1E" height="18" width="24" x="0" y="0" />
      <rect fill="#FFFFFF" height="10" width="3.6" x="10.2" y="4" />
      <rect fill="#FFFFFF" height="3.6" width="10" x="7" y="7.2" />
    </React.Fragment>
  ),
  CN: () => (
    <React.Fragment>
      <rect fill="#DE2910" height="18" width="24" x="0" y="0" />
      {star(5.4, 5.4, 3, '#FFDE00')}
      {star(10.4, 2.4, 1.1, '#FFDE00', 0.35)}
      {star(12.2, 4.9, 1.1, '#FFDE00', 0.75)}
      {star(12.2, 7.9, 1.1, '#FFDE00', 1.15)}
      {star(10.2, 10.2, 1.1, '#FFDE00', 0.35)}
    </React.Fragment>
  ),
  CZ: () => (
    <React.Fragment>
      <rect fill="#FFFFFF" height="9" width="24" x="0" y="0" />
      <rect fill="#D7141A" height="9" width="24" x="0" y="9" />
      <path d="M0,0 L11,9 L0,18 Z" fill="#11457E" />
    </React.Fragment>
  ),
  DE: () => horizontal('#000000', '#DD0000', '#FFCE00'),
  DK: () => nordic('#C8102E', '#FFFFFF'),
  EE: () => horizontal('#0072CE', '#000000', '#FFFFFF'),
  ES: () => (
    <React.Fragment>
      <rect fill="#AA151B" height="18" width="24" x="0" y="0" />
      <rect fill="#F1BF00" height="9" width="24" x="0" y="4.5" />
      <rect fill="#AA151B" height="4.6" rx="0.6" width="3.2" x="4.4" y="6.7" />
    </React.Fragment>
  ),
  FI: () => nordic('#FFFFFF', '#003580'),
  FR: () => vertical('#002395', '#FFFFFF', '#ED2939'),
  GB: () => unionFlag,
  GE: () => (
    <React.Fragment>
      <rect fill="#FFFFFF" height="18" width="24" x="0" y="0" />
      <path d="M10.4,0 H13.6 V18 H10.4 Z M0,7.4 H24 V10.6 H0 Z" fill="#FF0000" />
      {[
        [5, 3.4],
        [19, 3.4],
        [5, 14.6],
        [19, 14.6],
      ].map(([cx, cy], index) => (
        <path
          d={`M${cx - 1.3},${cy} H${cx + 1.3} M${cx},${cy - 1.3} V${cy + 1.3}`}
          fill="none"
          key={index}
          stroke="#FF0000"
          strokeWidth="0.9"
        />
      ))}
    </React.Fragment>
  ),
  GR: () => (
    <React.Fragment>
      <rect fill="#FFFFFF" height="18" width="24" x="0" y="0" />
      {[0, 2, 4, 6, 8].map((row) => (
        <rect fill="#0D5EAF" height="2" key={row} width="24" x="0" y={row * 2} />
      ))}
      <rect fill="#0D5EAF" height="10" width="10" x="0" y="0" />
      <rect fill="#FFFFFF" height="10" width="2" x="4" y="0" />
      <rect fill="#FFFFFF" height="2" width="10" x="0" y="4" />
    </React.Fragment>
  ),
  HR: () => (
    <React.Fragment>
      {horizontal('#FF0000', '#FFFFFF', '#171796')}
      <rect
        fill="#FFFFFF"
        height="5.4"
        stroke="#FF0000"
        strokeWidth="0.5"
        width="5.6"
        x="9.2"
        y="5"
      />
      <rect fill="#FF0000" height="1.35" width="1.4" x="9.2" y="5" />
      <rect fill="#FF0000" height="1.35" width="1.4" x="12" y="5" />
      <rect fill="#FF0000" height="1.35" width="1.4" x="10.6" y="6.35" />
      <rect fill="#FF0000" height="1.35" width="1.4" x="13.4" y="6.35" />
    </React.Fragment>
  ),
  HU: () => horizontal('#CE2939', '#FFFFFF', '#477050'),
  ID: () => horizontal('#FF0000', '#FFFFFF'),
  IL: () => (
    <React.Fragment>
      <rect fill="#FFFFFF" height="18" width="24" x="0" y="0" />
      <rect fill="#0038B8" height="2.1" width="24" x="0" y="2.6" />
      <rect fill="#0038B8" height="2.1" width="24" x="0" y="13.3" />
      <path
        d="M12,5.5 L15,10.7 L9,10.7 Z M12,12.5 L9,7.3 L15,7.3 Z"
        fill="none"
        stroke="#0038B8"
        strokeWidth="0.72"
      />
    </React.Fragment>
  ),
  IN: () => (
    <React.Fragment>
      {horizontal('#FF9933', '#FFFFFF', '#138808')}
      <circle cx="12" cy="9" fill="none" r="2.2" stroke="#000080" strokeWidth="0.7" />
    </React.Fragment>
  ),
  IR: () => (
    <React.Fragment>
      {horizontal('#239F40', '#FFFFFF', '#DA0000')}
      <path d="M12,7.2 L13.3,9.4 L12,10.8 L10.7,9.4 Z" fill="#DA0000" />
    </React.Fragment>
  ),
  IS: () => nordic('#02529C', '#FFFFFF', '#DC1E35'),
  IT: () => vertical('#009246', '#FFFFFF', '#CE2B37'),
  JP: () => (
    <React.Fragment>
      <rect fill="#FFFFFF" height="18" width="24" x="0" y="0" />
      <circle cx="12" cy="9" fill="#BC002D" r="5.2" />
    </React.Fragment>
  ),
  KR: () => (
    <React.Fragment>
      <rect fill="#FFFFFF" height="18" width="24" x="0" y="0" />
      <circle cx="12" cy="9" fill="#CD2E3A" r="4" />
      <path d="M8,9 A2,2 0 0,1 12,9 A2,2 0 0,0 16,9 A4,4 0 0,1 8,9 Z" fill="#0047A0" />
      {trigram(4.2, 3.6, 34)}
      {trigram(19.8, 3.6, -34)}
      {trigram(4.2, 14.4, -34)}
      {trigram(19.8, 14.4, 34)}
    </React.Fragment>
  ),
  LT: () => horizontal('#FDB913', '#006A44', '#C1272D'),
  LV: () => (
    <React.Fragment>
      <rect fill="#9E3039" height="18" width="24" x="0" y="0" />
      <rect fill="#FFFFFF" height="3.6" width="24" x="0" y="7.2" />
    </React.Fragment>
  ),
  MK: () => (
    <React.Fragment>
      <rect fill="#D20000" height="18" width="24" x="0" y="0" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
        <path
          d={`M12,9 L${(12 + 26 * Math.cos((index * Math.PI) / 4 - 0.16)).toFixed(2)},${(9 + 26 * Math.sin((index * Math.PI) / 4 - 0.16)).toFixed(2)} L${(12 + 26 * Math.cos((index * Math.PI) / 4 + 0.16)).toFixed(2)},${(9 + 26 * Math.sin((index * Math.PI) / 4 + 0.16)).toFixed(2)} Z`}
          fill="#FFE600"
          key={index}
        />
      ))}
      <circle cx="12" cy="9" fill="#FFE600" r="2.6" />
      <circle cx="12" cy="9" fill="#D20000" r="1.9" />
    </React.Fragment>
  ),
  MX: () => (
    <React.Fragment>
      {vertical('#006847', '#FFFFFF', '#CE1126')}
      <circle cx="12" cy="9" fill="none" r="1.9" stroke="#8C6239" strokeWidth="0.85" />
    </React.Fragment>
  ),
  MY: () => (
    <React.Fragment>
      <rect fill="#FFFFFF" height="18" width="24" x="0" y="0" />
      {[0, 1, 2, 3, 4, 5, 6].map((index) => (
        <rect fill="#CC0001" height={18 / 14} key={index} width="24" x="0" y={(index * 18) / 7} />
      ))}
      <rect fill="#010066" height="10.3" width="13.7" x="0" y="0" />
      {crescent(5.6, 5.2, 2.1, '#FFCC00', '#010066')}
    </React.Fragment>
  ),
  NL: () => horizontal('#AE1C28', '#FFFFFF', '#21468B'),
  NO: () => nordic('#BA0C2F', '#FFFFFF', '#00205B'),
  PK: () => (
    <React.Fragment>
      <rect fill="#01411C" height="18" width="24" x="0" y="0" />
      <rect fill="#FFFFFF" height="18" width="6" x="0" y="0" />
      {crescent(14.4, 9, 3.1, '#FFFFFF', '#01411C')}
    </React.Fragment>
  ),
  PL: () => horizontal('#FFFFFF', '#DC143C'),
  PT: () => (
    <React.Fragment>
      <rect fill="#FF0000" height="18" width="24" x="0" y="0" />
      <rect fill="#006600" height="18" width="9.6" x="0" y="0" />
      <circle cx="9.6" cy="9" fill="none" r="3.1" stroke="#FFD700" strokeWidth="1" />
      <rect
        fill="#FFFFFF"
        height="3"
        rx="0.4"
        stroke="#FF0000"
        strokeWidth="0.6"
        width="2.6"
        x="8.3"
        y="7.5"
      />
    </React.Fragment>
  ),
  RO: () => vertical('#002B7F', '#FCD116', '#CE1126'),
  RS: () => horizontal('#C6363C', '#0C4076', '#FFFFFF'),
  RU: () => horizontal('#FFFFFF', '#0039A6', '#D52B1E'),
  SA: () => (
    <React.Fragment>
      <rect fill="#165D31" height="18" width="24" x="0" y="0" />
      <rect fill="#FFFFFF" height="0.9" rx="0.45" width="14" x="5" y="6" />
      <rect fill="#FFFFFF" height="0.9" rx="0.45" width="11" x="6.5" y="8" />
      <rect fill="#FFFFFF" height="1" rx="0.5" width="15" x="4.5" y="11.4" />
    </React.Fragment>
  ),
  SE: () => nordic('#006AA7', '#FECC00'),
  SI: () => (
    <React.Fragment>
      {horizontal('#FFFFFF', '#0000A0', '#DE2E36')}
      <path
        d="M4.6,3.2 H9.4 V6.4 L7,8.6 L4.6,6.4 Z"
        fill="#FFFFFF"
        stroke="#0000A0"
        strokeWidth="0.6"
      />
      <path d="M7,4.2 L8.5,6.6 H5.5 Z" fill="#0000A0" />
    </React.Fragment>
  ),
  SK: () => (
    <React.Fragment>
      {horizontal('#FFFFFF', '#0B4EA2', '#EE1C25')}
      <path
        d="M5.4,4.6 H10.6 V9.2 C10.6,11 9.2,12.2 8,12.6 C6.8,12.2 5.4,11 5.4,9.2 Z"
        fill="#EE1C25"
        stroke="#FFFFFF"
        strokeWidth="0.7"
      />
      <path d="M8,6.2 V10.4 M6.4,7.8 H9.6" fill="none" stroke="#FFFFFF" strokeWidth="0.9" />
    </React.Fragment>
  ),
  TH: () => (
    <React.Fragment>
      <rect fill="#A51931" height="3" width="24" x="0" y="0" />
      <rect fill="#F4F5F8" height="3" width="24" x="0" y="3" />
      <rect fill="#2D2A4A" height="6" width="24" x="0" y="6" />
      <rect fill="#F4F5F8" height="3" width="24" x="0" y="12" />
      <rect fill="#A51931" height="3" width="24" x="0" y="15" />
    </React.Fragment>
  ),
  TR: () => (
    <React.Fragment>
      <rect fill="#E30A17" height="18" width="24" x="0" y="0" />
      {crescent(9.4, 9, 4.2, '#FFFFFF', '#E30A17')}
    </React.Fragment>
  ),
  TW: () => (
    <React.Fragment>
      <rect fill="#FE0000" height="18" width="24" x="0" y="0" />
      <rect fill="#000095" height="9" width="12" x="0" y="0" />
      {sunburst(6, 4.5, 1.5, '#FFFFFF')}
      <circle cx="6" cy="4.5" fill="#000095" r="0.75" />
    </React.Fragment>
  ),
  UA: () => horizontal('#0057B7', '#FFDD00'),
  US: () => (
    <React.Fragment>
      <rect fill="#FFFFFF" height="18" width="24" x="0" y="0" />
      {[0, 1, 2, 3, 4, 5, 6].map((index) => (
        <rect
          fill="#B31942"
          height={18 / 13}
          key={index}
          width="24"
          x="0"
          y={(index * 2 * 18) / 13}
        />
      ))}
      <rect fill="#0A3161" height={(7 * 18) / 13} width="9.6" x="0" y="0" />
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3, 4].map((column) => (
          <circle
            cx={1.1 + column * 1.9 + (row % 2) * 0.95}
            cy={1.3 + row * 2.4}
            fill="#FFFFFF"
            key={`${row}-${column}`}
            r="0.42"
          />
        )),
      )}
    </React.Fragment>
  ),
  VN: () => (
    <React.Fragment>
      <rect fill="#DA251D" height="18" width="24" x="0" y="0" />
      {star(12, 9, 4.4, '#FFFF00')}
    </React.Fragment>
  ),
}
