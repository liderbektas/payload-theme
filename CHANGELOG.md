# Changelog

All notable changes to `payload-theme` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/).

## [0.9.1] — 2026-08-15

### Fixed

- **The sidebar flickered and lost its scroll position on every navigation**
  ([#4](https://github.com/liderbektas/payload-theme/issues/4)). Payload
  renders the nav inside `DefaultTemplate`, which belongs to the page rather
  than the layout, so clicking a menu item remounts the whole sidebar. Two
  things fell out of that remount, both now handled:
  - **Icons blanked for a frame.** lucide's `DynamicIcon` re-imports its icon
    in an effect on every mount and renders nothing until that promise
    settles, so each navigation blanked all the icons and shifted the labels
    left before they popped back — the visible flicker. Resolved icons are now
    cached at module scope and render synchronously on later mounts, so the
    first paint after a navigation is already correct; the not-yet-loaded
    state is an empty box of the icon's size instead of nothing, so nothing
    shifts on the very first load either. The dashboard cards, ⌘K palette,
    header actions and user menu share the same cache.
  - **The menu scrolled back to the top.** With enough collections to make the
    entity list scroll, clicking an item you had to scroll down to threw the
    scrolled node away and started from 0. The offset is now remembered and
    restored before the browser paints the new page.
- The search pill no longer replays its `⌘K` → `Ctrl K` swap on every
  navigation for Windows and Linux users — the resolved label is remembered
  the same way.

## [0.9.0] — 2026-07-28

### Added

- **The theme speaks eight languages.** Every string the theme adds — the
  sidebar search pill, the ⌘K palette and its group headings, the dashboard
  captions and trend tooltips, "On this page", the whole customizer panel, the
  media view toggle, the login copy — was hardcoded English, so installing the
  plugin into a German or Turkish panel produced a half-translated admin.
  They now ship in **English, German, French, Spanish, Italian, Dutch,
  Portuguese and Turkish** under a `payloadTheme:*` namespace merged into
  `config.i18n.translations`, and follow the panel language the user picked.
  A language without a translation falls back to English rather than leaking
  raw keys, and a project that declares its own `payloadTheme:*` keys wins —
  the supported way to reword the theme without overriding a component.
  Strings Payload already ships (`general:close`, `authentication:logOut`,
  `general:createNewLabel`, …) are reused from its namespaces instead of
  duplicated.
- **`preset` — a whole look in one word.** `payloadTheme({ preset: 'ocean' })`
  sets accent, radius and typeface together. The six presets are the exact
  ones the header customizer offers (Zinc, Ocean, Forest, Sunset, Berry,
  Swiss), now defined once and shared by both, so a look you click is a look
  you can commit. Every option you pass explicitly still wins over the preset,
  so `{ preset: 'ocean', accent: '#e30613' }` is Ocean's geometry in your red.
- **Copy config writes the short form.** When the customizer's current state
  matches a preset exactly, the copied snippet is the one-line `preset:` form
  instead of three separate options.

### Changed

- **BREAKING (types only): `preset` no longer accepts `'soft' | 'noir' |
  'minimal'`.** Those values were validated, typed and exported but read by no
  component or stylesheet — the option did nothing. The name now carries the
  six real themes. Anything passing an old value gets a clear error naming the
  valid ones; nothing that worked before stops working, because nothing before
  worked.
- The playground now enables four panel languages (`de`, `en`, `fr`, `tr`) so
  the Account language switcher is real and the theme's own chrome can be
  checked outside English.

## [0.8.3] — 2026-07-24

### Fixed

- **Select menus clipped inside collapsibles, block and array rows:** Payload
  renders the `react-select` dropdown inline (no portal, `z-index: 4`), so the
  theme's `overflow: hidden` on `.collapsible` and the block/array list card —
  there to clip the cards' rounded corners — also clipped any select menu that
  opened inside them, hiding the lower options. The clip is now released with
  `:has(.rs__menu)` only while a menu is open, so corner clipping is preserved
  at rest and only the card holding the open menu is affected; the menu's
  `z-index` is lifted to sit over the fields it overflows onto.

## [0.8.2] — 2026-07-22

### Fixed

- **Content card lost its right gutter:** Payload sizes the frame's content
  card at `width: 100%` of its grid track, so the theme's 8px right margin
  overflowed the viewport instead of insetting the card — the panel looked
  padded on the left and flush on the right. The card now sizes to the track
  minus its margins, so both gutters match at every nav state and width.

### Changed

- **Dashboard trend chips read "New" instead of disappearing:** a collection
  with documents but no activity in the previous 30-day window now shows a
  neutral "New" chip. Most real projects are younger than 60 days or import
  their content at once, so the old "no baseline → no chip" rule hid the
  trend row on exactly the installs that just got started. Only collections
  with no activity in either window stay chip-less.
- **README screenshots regenerated** against the current build, and the
  tagline is the same line in both the repo and npm READMEs.

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
