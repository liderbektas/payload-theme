# Changelog

All notable changes to `payload-theme` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

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
