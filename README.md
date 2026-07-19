<div align="center">

# payload-theme

**Make your Payload admin panel look like a $50k custom build — in 2 lines.**

One accent color in, a complete shadcn-style redesign out: dashboard with sparklines, ⌘K command palette, grouped icon sidebar, split-screen login, a live theme customizer — light *and* dark.

[![CI](https://github.com/liderbektas/payload-theme/actions/workflows/ci.yml/badge.svg)](https://github.com/liderbektas/payload-theme/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/payload-theme?color=4f4ece)](https://www.npmjs.com/package/payload-theme)
[![npm downloads](https://img.shields.io/npm/dm/payload-theme?color=4f4ece)](https://www.npmjs.com/package/payload-theme)
[![Payload 3](https://img.shields.io/badge/Payload-3.x-000000)](https://payloadcms.com)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/liderbektas/payload-theme/blob/main/LICENSE)

[**Quickstart**](#installation) · [**Tour**](#the-tour) · [**Try the demo**](#-try-it-in-60-seconds) · [**Options**](#options)

<br/>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/dashboard-dark.png">
  <img alt="payload-theme dashboard" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/dashboard.png" width="100%">
</picture>

<sub>The same panel, one plugin later. Every pixel above ships in this package.</sub>

</div>

---

## Why

Payload is the best headless CMS in the Node ecosystem — and its admin panel looks like a database UI. Clients notice. Editors notice. **payload-theme** turns the stock panel into something people screenshot, without forking a single component:

- 🎨 **One accent color drives everything** — an 11-step OKLCH scale recolors buttons, focus rings, nav, sparklines, the login glow. Automatic WCAG contrast included.
- 🧱 **No forked components, no config surgery** — a plugin entry and a CSS import. Remove both lines and you're back to stock.
- 🌗 **Dark mode designed, not inverted** — every surface sits on a zinc ladder; dark gets its own remapped scale.
- ⚡ **Zero runtime cost** — color math runs once at startup and lands as CSS custom properties. SSR-safe, no FOUC.

## Installation

```bash
pnpm add payload-theme
# or: npm i payload-theme / yarn add payload-theme
```

**Line 1** — add the plugin to `payload.config.ts`:

```ts
import { payloadTheme } from 'payload-theme'

export default buildConfig({
  plugins: [
    payloadTheme({ accent: '#4f4ece' }),
  ],
})
```

**Line 2** — import the stylesheet in `src/app/(payload)/custom.scss` (every `create-payload-app` project already has this file):

```scss
@import 'payload-theme/styles.css';
```

Then regenerate the import map and restart:

```bash
npx payload generate:importmap
```

Open the admin panel. That's the whole migration. 🎉

---

## The tour

### A login screen people screenshot

A split card: a permanently-dark brand panel whose glow is painted from **your accent**, your logo, your copy (`login.heading` / `login.tagline`) — and the form beside it.

<img alt="Login" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/login.png" width="100%">

### A dashboard that's actually a dashboard

The default dashboard becomes a widget grid: one stat card per collection with an animated count and a **30-day creation sparkline**, cards for your globals, and — if you want — **your own React widgets** below it ([docs](#dashboard-widgets)). Server-rendered through Payload's local API: access control applies, no loading flash.

<img alt="Dashboard" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/dashboard.png" width="100%">

### A sidebar that reads like a product

Your logo on top, a ⌘K search pill, **grouped collections with lucide icons** (`admin.group` + `nav.icons`), an accent pill on the active item, and a shadcn-style **user block pinned to the bottom** — avatar, name, email, and a popup with Account, the locale switcher and Log out. When collections overflow, only the menu scrolls; logo, search and the user block stay put.

### ⌘K command palette

Press `⌘K` / `Ctrl+K` anywhere: jump to any collection or global, **search documents across collections as you type**, switch light/dark, or log out. Ships inside the theme — zero extra dependencies.

<img alt="Command palette" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/command-palette.png" width="100%">

### A live theme customizer in the header

The palette button opens a panel where anyone can restyle the panel at runtime — no rebuild, no deploy:

- **Accent** — 10 curated presets + a free hex field, recoloring the entire panel live through the same OKLCH engine
- **Radius** — the whole `'none' → 'full'` scale
- **Color mode** — light/dark, stored in the same preference Payload's Account page uses
- **Content layout** — centered (~1280px) or full width

Everything persists in the browser; **Reset to Default** returns to your config.

<img alt="Theme customizer" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/customizer.png" width="100%">

### Blocks that read like a page outline

Structured content stops looking like stock Payload. Block and array rows render as **one unified list** — hairline-divided entries with a muted row number, a **per-block-type icon**, the block title, and quiet ghost actions. The theme ships icons for common slugs (`content`, `cta`, `hero`); any project block opts in with one CSS custom property:

```scss
.blocks-field__block-pill-gallery {
  --pt-block-ico: url("data:image/svg+xml,..."); /* any 24×24 stroke SVG */
}
```

Adding rows is one consistent gesture everywhere — a full-width dashed bar that lights up in the accent on hover. The block-picker drawer shows shadcn-style cards.

<img alt="Blocks list with per-type icons" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/blocks.png" width="100%">

### Edit views: a real form layout, not a field pile

One content card with a **two-column field grid**: compact fields pair up (*Title | Slug*), wide surfaces keep the full row, everything stacks below 1024px. Inputs follow the shadcn language (thin borders, accent focus ring), checkboxes render as toggles, top-level groups sit in raised panels, and the sticky action bar — icons on every action — blurs the content scrolling underneath.

<img alt="Edit view" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/edit-view.png" width="100%">

Tabs, radio groups, JSON, code editors, date pickers, multi-selects, relationship fields — all themed:

<img alt="Tabs and field types" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/projects.png" width="100%">

### List views & a real media library

Tables become clean cards under a single-row toolbar — search, Columns/Filters pills and a solid **＋ Create New** on one line. Status and boolean values render as always-round neutral badges, and empty collections get an illustrated empty state.

<img alt="List view" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/list-view.png" width="100%">

<img alt="Media grid" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/media-grid.png" width="100%">

### Dark mode, for free

Every surface, badge, card and glow is token-driven. Nested surfaces get *lighter* as they stack (never darker "wells"), fields inside raised panels sit flat with their borders doing the work, and the accent is remapped so it stays vivid on dark.

<img alt="Dark edit view" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/edit-view-dark.png" width="100%">

---

## 🚀 Try it in 60 seconds

The repo ships a **full demo panel** — six collections, every field type, block-built pages, a seeded media library:

```bash
git clone https://github.com/liderbektas/payload-theme
cd payload-theme && pnpm install && pnpm build
cp dev/.env.example dev/.env
pnpm seed && pnpm dev
```

Open [http://localhost:3000/admin](http://localhost:3000/admin) and log in:

| User | Password | Role |
| --- | --- | --- |
| `dev@local.test` | `test1234` | Admin |
| `editor@local.test` | `test1234` | Editor |

Play with the header's theme customizer — accent, radius, color mode and layout all apply live.

---

## Options

Everything is optional. This is the full surface:

```ts
payloadTheme({
  // The one color that drives everything: buttons, active nav pill,
  // focus rings, selected rows, sparklines, the login glow... Any hex works.
  accent: '#e30613',

  // Corner rounding for the WHOLE panel: 'none' | 'sm' | 'md' | 'lg' | 'full'.
  radius: 'md',

  // Your logo — top of the sidebar AND above the login form.
  // A URL, or { light, dark } to swap artwork per color scheme.
  logo: { light: '/logo.svg', dark: '/logo-dark.svg' },

  // Rendered height of the logo: a number in px, or any CSS length.
  logoHeight: 28,

  // Small mark, used as a fallback for the login logo.
  icon: '/mark.svg',

  // Copy on the login brand panel.
  login: {
    heading: 'Welcome back',
    tagline: 'Sign in to manage your content.',
  },

  // Sidebar + dashboard + palette icons per collection/global slug —
  // any icon name from lucide.dev.
  nav: {
    icons: {
      posts: 'newspaper',
      media: 'image',
      users: 'users',
      settings: 'settings',
    },
  },

  // Your own React components below the built-in dashboard content.
  dashboard: {
    widgets: [
      '/components/widgets/StatisticsWidget#StatisticsWidget',
      { component: '/components/widgets/LastLoginWidget#LastLoginWidget', width: 'third' },
    ],
  },

  // Escape hatch: raw --pt-* token overrides, applied last.
  cssVariables: {
    '--pt-radius-card': '10px',
  },
})
```

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `accent` | `string` (hex) | `#4f4ece` | Generates a full 50–950 color scale in OKLCH and colors every interactive element with it. |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` | `'md'` | Global corner rounding — buttons, inputs, badges, cards, tables, popovers and menu items all follow it. |
| `logo` | `string \| { light, dark }` | Payload logo | Image URL(s) shown at the top of the sidebar and above the login form. |
| `logoHeight` | `number \| string` | `26` | Rendered logo height — a number is px, a string is any CSS length. |
| `icon` | `string \| { light, dark }` | — | Small mark, used as a login-logo fallback. |
| `login.heading` | `string` | `'Welcome back'` | Big heading on the login brand panel. |
| `login.tagline` | `string` | `'Sign in to manage your content.'` | Supporting line under the heading. |
| `nav.icons` | `Record<slug, iconName>` | folder icon | Maps collections/globals to [lucide](https://lucide.dev) icons — sidebar, dashboard cards and palette. |
| `dashboard.widgets` | `DashboardWidget[]` | `[]` | Custom components rendered below the built-in dashboard content. |
| `cssVariables` | `Record<string, string>` | — | Escape hatch: override any raw `--pt-*` token directly. |

## Dashboard widgets

The built-in dashboard always renders as-is — widgets are an *additional* area below it. Point each entry at a React component using Payload's standard import-map path convention:

```ts
payloadTheme({
  dashboard: {
    widgets: [
      // string form — 'half' width by default
      '/components/widgets/StatisticsWidget#StatisticsWidget',
      // object form — 'full' | 'half' | 'third'
      { component: '/components/widgets/LastLoginWidget#LastLoginWidget', width: 'third' },
    ],
  },
})
```

**Server components** receive the live Payload context as props:

```tsx
import type { DashboardWidgetServerProps } from 'payload-theme'

export const StatisticsWidget: React.FC<DashboardWidgetServerProps> = async ({ payload, user }) => {
  const drafts = await payload.count({
    collection: 'posts',
    overrideAccess: false,
    user,
    where: { _status: { equals: 'draft' } },
  })
  return <article className="pt-dash__card">…{drafts.totalDocs}…</article>
}
```

**Client components** (`'use client'`) receive no props — use Payload's hooks or the REST API. The plugin registers every widget in `admin.dependencies`, so `payload generate:importmap` picks them up automatically.

Reuse the theme's card classes (`pt-dash__card`, `pt-dash__card-head`, `pt-dash__card-label`, `pt-dash__card-body`, `pt-dash__card-count`, `pt-dash__card-caption`) if you want your widget to match the built-in stat cards.

## Under the hood

- **One accent, everywhere** — your hex becomes an 11-step OKLCH scale; every interactive element recolors consistently.
- **Smart dark mode** — the scale is re-mapped for dark (brighter accent step, never a naive inversion).
- **Automatic contrast** — text on the accent picks black or white by WCAG relative luminance.
- **Toggles, not checkboxes** — pure CSS; form behavior and accessibility untouched.
- **Zero runtime color math** — computed once at startup, injected as CSS custom properties. No FOUC, SSR-safe.
- **Non-destructive** — everything ships in `@layer payload`, overriding Payload's defaults without specificity wars or `!important`.
- **Zinc foundation** — Payload's neutral scale is retargeted to the shadcn zinc ladder, light *and* dark.
- **Icons via CSS masks** — glyphs are `currentColor` masks; they recolor with every state, accent and scheme.
- **Runtime restyling** — the customizer recomputes the accent scale client-side with the same engine the server uses.

## Fine-tuning with CSS variables

Every token is a plain CSS custom property:

```ts
payloadTheme({
  accent: '#0ea5e9',
  cssVariables: {
    '--pt-accent-subtle': 'oklch(0.95 0.03 240)',
  },
})
```

The important ones: `--pt-accent-50` … `--pt-accent-950`, `--pt-accent`, `--pt-accent-hover`, `--pt-accent-active`, `--pt-accent-subtle`, `--pt-accent-contrast`, `--pt-accent-ring`, plus the radius tokens `--pt-radius-ctl`, `--pt-radius-card`, `--pt-radius-item`, and the per-block icon hook `--pt-block-ico`.

## Requirements

- Payload **3.x** (peer range `^3.0.0`; developed and e2e-tested against **3.85**)
- Next.js **15+**, React **19**

## Troubleshooting

**"Component not found in import map"** — run `npx payload generate:importmap` after installing, then restart the dev server.

**Styles not applying** — make sure `@import 'payload-theme/styles.css';` is in `src/app/(payload)/custom.scss`.

**Theme changes not showing in dev** — Turbopack caches aggressively; delete your app's `.next` folder and restart.

**`Invalid accent color: '…'`** — the accent must be a hex string like `#7c3aed`.

## License

MIT © [Lider Bektaş](https://github.com/liderbektas)

Found a bug or want a feature? [Issues and PRs welcome](https://github.com/liderbektas/payload-theme/issues).

---

## Development (this monorepo)

```
packages/payload-theme   the plugin (published to npm)
dev                      a Payload 3 playground app that consumes it
docs                     README screenshots
```

```bash
pnpm install
pnpm build          # build the plugin
pnpm seed           # seed the playground with demo content
pnpm dev            # start the playground at http://localhost:3000/admin
pnpm test           # unit + integration tests
pnpm lint           # eslint across the repo
pnpm --filter dev test:e2e     # Playwright against the real admin panel
pnpm --filter dev test:visual  # screenshot regression suite
```

See [CONTRIBUTING.md](https://github.com/liderbektas/payload-theme/blob/main/CONTRIBUTING.md) for the full guide and [CHANGELOG.md](https://github.com/liderbektas/payload-theme/blob/main/CHANGELOG.md) for history.
