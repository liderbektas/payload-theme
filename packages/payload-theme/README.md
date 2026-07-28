<div align="center">

# payload-theme

**Make your Payload admin panel look custom-built — in 2 lines.**

One accent color in, a complete shadcn-style redesign out: dashboard with sparklines and 30-day trends, ⌘K command palette with recents, grouped icon sidebar, split-screen login, sticky document outlines, and a live theme customizer with one-click presets, five typefaces and a copy-paste config generator — light *and* dark, in eight languages.

[![CI](https://github.com/liderbektas/payload-theme/actions/workflows/ci.yml/badge.svg)](https://github.com/liderbektas/payload-theme/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/payload-theme?color=0d9488)](https://www.npmjs.com/package/payload-theme)
[![npm downloads](https://img.shields.io/npm/dm/payload-theme?color=0d9488)](https://www.npmjs.com/package/payload-theme)
[![Payload 3](https://img.shields.io/badge/Payload-3.x-000000)](https://payloadcms.com)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/liderbektas/payload-theme/blob/main/LICENSE)

[**Quickstart**](#installation) · [**Tour**](#the-tour) · [**Try the demo**](#-try-it-in-60-seconds) · [**Options**](#options)

<br/>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/dashboard-nav-dark.png">
  <img alt="payload-theme dashboard" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/dashboard-nav.png" width="100%">
</picture>

<sub>The same panel, one plugin later. Every pixel above ships in this package.</sub>

</div>

---

## Why

Payload is the best headless CMS in the Node ecosystem — and its admin panel looks like a database UI. Clients notice. Editors notice. **payload-theme** turns the stock panel into something people screenshot, without forking a single component:

<img alt="The same Payload dashboard before and after payload-theme" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/before-after.png" width="100%">

<sub>Same panel, same data — the only difference is one plugin.</sub>


- 🎨 **One accent color drives everything** — an 11-step OKLCH scale recolors buttons, focus rings, nav, sparklines, the login glow. Automatic WCAG contrast included.
- 🧱 **No forked components, no config surgery** — a plugin entry and a CSS import. Remove both lines and you're back to stock.
- 🌗 **Dark mode designed, not inverted** — every surface sits on a zinc ladder; dark gets its own remapped scale.
- ⚡ **Zero runtime cost** — color math runs once at startup and lands as CSS custom properties. SSR-safe, no FOUC.
- 📱 **A real phone experience** — a sliding drawer over a blurred scrim, wrapping bulk actions, aligned cards. Editors approve from the couch.
- 🌍 **Not half-English** — every string the theme adds is translated in eight languages and follows the panel language your editors picked.

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
    payloadTheme({ accent: '#0d9488' }),
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

The default dashboard becomes a widget grid: one stat card per collection with an animated count, a **30-day creation sparkline** and a **trend chip** (`+12%`, `-8%` — this month's created docs vs the month before), cards for your globals, and — if you want — **your own React widgets** below it ([docs](#dashboard-widgets)). Server-rendered through Payload's local API: access control applies, no loading flash.

<img alt="Dashboard" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/dashboard.png" width="100%">

### A sidebar that reads like a product

Your logo on top, a ⌘K search pill, **grouped collections with lucide icons** (`admin.group` + `nav.icons`), an accent pill on the active item, and a shadcn-style **user block pinned to the bottom** — avatar, name, email, and a popup with Account, the locale switcher and Log out. When collections overflow, only the menu scrolls; logo, search and the user block stay put. On desktop, a **panel toggle at the header's left** collapses the whole sidebar with a smooth grid animation — full-width content one click away.

### ⌘K command palette

Press `⌘K` / `Ctrl+K` anywhere: your **five most recent documents** wait at the top, jump to any collection or global, **search documents across collections as you type**, **create a new document in any collection**, switch light/dark, or log out. Ships inside the theme — zero extra dependencies. And press `?` anywhere for the keyboard-shortcuts cheatsheet.

<img alt="Command palette" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/command-palette.png" width="100%">

### A live theme customizer in the header

The palette button opens a panel where anyone can restyle the panel at runtime — no rebuild, no deploy:

- **Presets** — six one-click full themes (Zinc, Ocean, Forest, Sunset, Berry, Swiss), each a coherent accent + radius + typeface identity. The same six are config values, so a look you like here is `preset: 'ocean'` in your `payload.config.ts` — and **Copy config** writes exactly that one line when the panel matches a preset
- **Accent** — 10 curated swatches + a free hex field, recoloring the entire panel live through the same OKLCH engine
- **Radius** — the whole `'none' → 'full'` scale
- **Font** — Inter, Geist, Helvetica or the system stack, each button previewing its own face
- **Color mode** — light/dark, stored in the same preference Payload's Account page uses
- **Content layout** — centered (~1280px) or full width

Everything persists in the browser; **Reset** returns to your config — and **Copy config** turns whatever is on screen into a ready-to-paste `payloadTheme({ ... })` snippet, so the customizer doubles as your config generator.

<img alt="Theme customizer" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/customizer.png" width="100%">

### It speaks your panel's language

If your panel isn't in English, the theme isn't either. Every string it adds — the sidebar's search pill, the palette and its groups, the dashboard captions and trend tooltips, "On this page", the customizer's own labels, the login copy — ships translated in **English, German, French, Spanish, Italian, Dutch, Portuguese and Turkish**, and follows whatever language the user picked on their Account page.

Nothing to configure: the plugin merges a `payloadTheme:*` namespace into `config.i18n.translations` for every language Payload accepts. A language without a translation yet falls back to English rather than leaking raw keys, and anything you declare under that namespace yourself wins — which is also the supported way to reword the theme without touching a component:

```ts
i18n: {
  supportedLanguages: { de, en },
  translations: {
    de: { payloadTheme: { onThisPage: 'Inhaltsverzeichnis' } },
  },
},
```

> Payload's admin panel is English-only until you list languages in `i18n.supportedLanguages` — that's a Payload default, not a theme one. The theme simply follows whatever you set there.

Missing your language? It's [one file](https://github.com/liderbektas/payload-theme/tree/main/packages/payload-theme/src/translations) — copy `en.ts`, translate the values, add one line to `index.ts`. PRs very welcome.

### A document outline that follows your scroll

Long edit forms get a sticky **"On this page" rail** pinned to the right edge of wide viewports: quiet tick bars at rest, a labeled panel on hover. Entries are the form's top-level sections — groups, collapsibles, blocks, arrays, and **every tab of a tabs field**. Click to scroll (or switch tab); the active section tracks as you read. Renders only when a document has 3+ sections, and never on small screens.

<img alt="Document outline" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/outline.png" width="100%">

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

### Actually responsive — not just "it fits"

On the phone the panel becomes a product of its own: the sidebar turns into a **~300px drawer sliding over a blurred scrim** (tap the scrim to close — no clumsy ✕), the toggler wears the same panel mark as desktop, bulk actions wrap into tidy chip rows, stat cards stack, and edit views keep the exact same card language.

<p align="center">
  <img alt="Mobile drawer" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/mobile-drawer.png" width="32%">
  <img alt="Mobile list view" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/mobile-list.png" width="32%">
  <img alt="Mobile edit view, dark" src="https://raw.githubusercontent.com/liderbektas/payload-theme/main/docs/mobile-edit-dark.png" width="32%">
</p>

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

Play with the header's theme customizer — accent, radius, color mode and layout all apply live. The panel ships with four languages enabled, so the Account page's language switcher shows the theme following along.

---

## Options

Everything is optional. This is the full surface:

```ts
payloadTheme({
  // A whole look in one word — accent + radius + typeface together:
  // 'zinc' | 'ocean' | 'forest' | 'sunset' | 'berry' | 'swiss'.
  // The same six the header customizer offers. Anything you also set
  // explicitly below wins over the preset.
  preset: 'ocean',

  // The one color that drives everything: buttons, active nav pill,
  // focus rings, selected rows, sparklines, the login glow... Any hex works.
  accent: '#e30613',

  // Corner rounding for the WHOLE panel: 'none' | 'sm' | 'md' | 'lg' | 'full'.
  radius: 'md',

  // Panel typeface: 'inter' | 'geist' (Google Fonts, loaded at runtime),
  // 'helvetica' | 'system' (pure font stacks, no network) — or any custom
  // CSS font-family stack (self-host the @font-face yourself).
  font: 'inter',

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
| `preset` | `'zinc' \| 'ocean' \| 'forest' \| 'sunset' \| 'berry' \| 'swiss'` | — | Sets `accent`, `radius` and `font` together as one coherent identity. Each option you pass explicitly overrides its part. |
| `accent` | `string` (hex) | `#4f4ece` | Generates a full 50–950 color scale in OKLCH and colors every interactive element with it. |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` | `'md'` | Global corner rounding — buttons, inputs, badges, cards, tables, popovers and menu items all follow it. |
| `font` | `'inter' \| 'geist' \| 'helvetica' \| 'system' \| string` | Payload's font | Panel typeface. `inter`/`geist` load from Google Fonts at runtime; `helvetica`/`system` are pure stacks; any other string is used as a custom font-family stack. |
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

## What it touches

No component is forked and no file of yours is rewritten: the plugin adds keys to your Payload config and restyles the markup Payload already renders. This is the complete surface — worth a read before you layer your own customizations on top, and the first place to look when a Payload upgrade changes something.

**Config keys the plugin sets** ([`src/index.ts`](https://github.com/liderbektas/payload-theme/blob/main/packages/payload-theme/src/index.ts)):

| Key | Effect | What it is |
| --- | --- | --- |
| `admin.components.Nav` | **replaces** | The grouped icon sidebar, ⌘K pill and user block. |
| `admin.components.views.dashboard.Component` | **replaces** | The stat-card dashboard. |
| `admin.components.providers` | adds 2 | `ThemeProvider` (injects the `--pt-*` tokens) and `ListQuickActions` (row-hover edit/delete). |
| `admin.components.actions` | adds 1 | `HeaderActions` — customizer, light/dark toggle, user menu. |
| `admin.components.beforeLogin` | adds 1 | `LoginHero` — the brand panel. The split login layout only applies when it renders. |
| `admin.custom.payloadTheme` | adds 1 | The resolved theme config the client components read. |
| `admin.dependencies` | adds 1 per widget | So `generate:importmap` finds your `dashboard.widgets`. |
| `i18n.translations` | adds 1 namespace per language | The theme's own `payloadTheme:*` strings. Your keys are preserved and win; `supportedLanguages` and `fallbackLanguage` are untouched. |
| `admin.components.beforeListTable` *(upload collections)* | adds 1 | The grid/table toggle above media lists. |
| checkbox fields' `admin.components.Cell` | adds, only when unset | Boolean columns render as Yes/No chips instead of `true`/`false`. |

The two **replacements** are the only conflicts. If your project already sets a custom `Nav` or its own dashboard view, the theme overwrites it — plugins run in array order, so re-assign yours in a small transform *after* `payloadTheme()` and it wins:

```ts
plugins: [
  payloadTheme({ accent: '#0d9488' }),
  (config) => ({
    ...config,
    admin: { ...config.admin, components: { ...config.admin?.components, Nav: '/components/MyNav#MyNav' } },
  }),
]
```

Everything else is additive and order-preserving: your components stay, the theme's are appended after them.

Nothing else is read or written. Collections, fields, hooks, access control, endpoints and your data are untouched, and removing the plugin entry plus the CSS import returns you to a stock panel with no migration.

**Styles.** The whole stylesheet lives in `@layer payload`, which Payload pre-declares *after* its own `payload-default` layer — so the theme wins without `!important` and your own unlayered CSS still beats the theme. The exceptions are a handful of rules that must be unlayered because the Payload/third-party stylesheets they override are (empty-list results, thumbnail sizing, react-datepicker, toasts); they are isolated in one file, [`styles/overrides/unlayered.css`](https://github.com/liderbektas/payload-theme/blob/main/packages/payload-theme/src/styles/overrides/unlayered.css).

**On a Payload upgrade.** Two kinds of coupling can drift:

- **Class names.** The stylesheet targets Payload's own BEM classes (`.document-fields__fields`, `.blocks-field__rows`, `.collection-list .table`, …). If Payload renames one, the affected rules simply stop applying — stock styling shows through in that one spot. Nothing throws, nothing breaks functionally.
- **Rendered DOM.** Three enhancements work off the rendered markup rather than a schema: the row actions column (injected into list tables), the document outline (scans the edit form), and the media grid (a CSS reflow of the upload list table). All three fail soft — no column, no rail, a plain table — rather than erroring.

Everything else rides on public API (`@payloadcms/ui` hooks, the local API, REST routes from `config.routes`), so a breaking change there surfaces at build time instead of silently. The package is developed against the Payload version listed under [Requirements](#requirements) and each release is verified with a screenshot-regression suite across the whole panel; if a newer Payload shifts something before an update ships, [open an issue](https://github.com/liderbektas/payload-theme/issues) — a class-name fix is usually a one-line patch. Maintainers: the full coupling map and upgrade checklist live in [CONTRIBUTING.md](https://github.com/liderbektas/payload-theme/blob/main/CONTRIBUTING.md#keeping-up-with-payload).

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
