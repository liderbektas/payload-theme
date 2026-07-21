# Changelog

All notable changes to `payload-theme` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/).

## [0.8.1] — 2026-07-21

### Changed

- **README hero:** the lead screenshot now shows the dashboard with the
  sidebar expanded (light + dark), so the grouped icon nav, ⌘K search and
  active-item accent are visible at first glance on npm and GitHub.

## [0.8.0] — 2026-07-21

### Added

- **Theme presets:** the header customizer opens with six one-click full
  themes — Zinc, Ocean, Forest, Sunset, Berry, Swiss — each a coherent
  accent + radius + typeface identity applied live.
- **Copy config:** a customizer button that turns whatever is on screen
  (accent, radius, font) into a ready-to-paste `payloadTheme({ ... })`
  snippet — the customizer is now a config generator, not just a toy.
- **`font` option + customizer Font row:** swap the panel typeface to
  `'inter'`, `'geist'` (Google Fonts, loaded at runtime), `'helvetica'`,
  `'system'` (pure stacks, no network) or any custom CSS font-family stack.
  Each customizer font button previews itself in its own face.
- **⌘K Recent group:** the last five documents you opened sit at the top of
  the palette — tracked from the URL per browser, titles resolved through
  the REST API on open (deleted/forbidden docs silently drop out).
- **⌘K Create group:** "New \<Type\>" commands for every collection you may
  create in — jump straight to a blank document from anywhere.
- **Document outline:** long edit forms get a sticky "On this page" rail
  pinned to the viewport's right edge (≥1500px) — tick bars at rest, a
  labeled panel on hover. Entries are the form's top-level sections (groups,
  collapsibles, blocks, arrays) and each tab of a tabs field; clicking
  scrolls (or switches tab), the active section follows the scroll.
- **Keyboard shortcuts modal:** press `?` anywhere for a cheatsheet card;
  also reachable from the palette ("Keyboard shortcuts").
- **Dashboard trend chips:** every stat card compares the last 30 days of
  created docs against the 30 before and shows a quiet pill — `+12%`, `-8%`
  or `±0%` — next to the count (no baseline → no chip).
- Press feedback: solid buttons dip 1px while pressed (reduced-motion safe).

### Changed

- **Mobile nav is a real drawer** (≤1440px): a ~300px panel sliding in over
  a blurred, dimmed scrim — no more full-width takeover. The X button is
  gone; tapping the scrim, pressing Esc, or navigating closes it. The
  header toggler now wears lucide's panel-left-open mark. Fixes the layout
  crush where opening the stock nav squeezed every page to zero width.
- **Desktop sidebar collapse** (>1440px): a panel toggle chip at the app
  header's left edge collapses/expands the sidebar with an animated grid
  transition — same panel-left mark as the mobile toggler, perfectly
  aligned with the header's right-side chips in every scroll state.
- **Mobile list & edit fixes** (≤768px): the bulk-selection bar leaves its
  broken fixed-bottom position (it overflowed the right edge and covered
  the pagination row) and flows under the page controls with wrapping
  chips; stacked edit-view sidebar cards now align exactly with the main
  fields card instead of running full-bleed.

## [0.7.0] — 2026-07-19

### Added

- **Blocks & arrays — unified list:** rows render as one bordered list card
  with hairline dividers instead of separate floating cards; muted tabular
  row numbers, ghost kebab/chevron actions, and a neutral **per-block-type
  icon tile**. Ships glyphs for `content`, `cta` and `hero`; any block slug
  opts in via the `--pt-block-ico` custom property on its pill class.
- README rebuilt as a product page (light/dark hero pair, full themed tour)
  with absolute image URLs so the gallery renders on npmjs.com as well.

### Changed

- **Dark mode surfaces:** nested surfaces now get *lighter* as they stack —
  top-level group panels (e.g. Seo) are a raised `elevation-100` surface
  instead of a near-black well, and every field box inside a lifted surface
  (inputs, textareas, selects, upload cards) sits flat and transparent with
  its border doing the work, focus included.
- Sidebar footer (user block) docks at the sidebar's bottom edge — stock's
  ~40px `--nav-padding-block-end` reduced to 10px.
- npm metadata: sharper description and expanded keywords.

## [0.6.0] — 2026-07-19

### Added

- **List views:** checkbox columns render a round tick/X icon chip (`BoolCell`)
  instead of raw `true`/`false`; every row carries persistent edit + delete
  actions at the table's right edge (two-step "Delete?" confirm via REST).
- **Media library:** upload collections get a grid/table switch — the grid
  relays each row as a card with full-bleed 4:3 artwork, filename + meta,
  hover date chip and a floating selection checkbox with an accent ring.
- **Micro-interactions:** stat-card and picker-card hover lift, skeleton
  (shimmer) restyle, sonner toast redesign with semantic icon colors, CSS-only
  login-glow drift, dropzone drag pulse — all behind `prefers-reduced-motion`.
- Theme customizer swatch row now leads with the accent configured in the
  plugin options.
- Repo: CI workflow, visual-regression suite (`pnpm --filter dev test:visual`),
  root LICENSE, CONTRIBUTING guide, issue/PR templates, ESLint + Prettier.

### Changed

- Dashboard stat cards follow the reference stat-card grammar: muted label
  left, round neutral icon chip right, large count, accent sparkline pinned to
  the card's bottom.
- Bulk-selection bar actions (Select all / Edit / Publish / Unpublish /
  Delete) are outline chips instead of underlined links.
- Status/select badges are uniformly neutral chips (no semantic dots/colors).
- Confirmation modals: title and supporting line read as one block.
- Two-column form grid: toggles align with the neighbouring input's box.
- `src/styles` is split into ~30 reviewable modules; the published
  `dist/styles/theme.css` remains a single flat file (byte-identical cascade).

## [0.5.0] — 2026-07-17

### Added

- Structured-field card system: blocks/arrays/collapsibles as real cards with
  composed headers (grip, numbered chip, title, ghost inline title editor).
- Two-column form grid for compact field types on desktop.

### Changed

- shadcn "inset" layout: zinc canvas, sidebar directly on the page background,
  all content in one rounded floating card with a sticky translucent header.
- Header theme customizer (accent / radius / color mode / layout, persisted).

## [0.4.0] — 2026-07-13

### Added

- Page-header system for list and edit views (calm title + toolbar grammar).
- Dashboard widgets option (`dashboard.widgets`), sidebar user menu.

## [0.3.0] — 2026-07-11

### Added

- Split-layout login hero, dashboard v2 with sparklines, ⌘K command palette,
  radius system (`none`–`full`).

## [0.2.0] — 2026-07-11

### Added

- First public cut: OKLCH accent engine, soft zinc preset, restyled forms,
  buttons, tables and nav.
