# payload-theme

**A premium, single-accent theme for the Payload CMS admin panel — installed in 2 lines.**

Pick one accent color and the whole panel repaints itself: a split-screen login, a dashboard with live counts, 30-day sparklines and **your own custom widgets**, a ⌘K command palette, an icon sidebar with your logo on top and a shadcn-style **user menu** at the bottom — all wrapped in a shadcn-style **inset layout**: a quiet zinc canvas with the sidebar sitting directly on it, and every view floating in one rounded white content card. The sticky header carries a **theme customizer** (accent, radius, color mode, content layout — live, persisted), a light/dark toggle and a compact user menu. No forked components, no config surgery — just a plugin and a CSS import.

![Dashboard](docs/dashboard.png)

---

## Installation

```bash
pnpm add payload-theme
# or: npm i payload-theme / yarn add payload-theme
```

**Line 1** — add the plugin to your `payload.config.ts`:

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

Then regenerate the import map so Payload can find the theme's components:

```bash
npx payload generate:importmap
```

Restart your dev server, open the admin panel — that's it. 🎉

---

## Tour

### A login screen people screenshot

The login becomes a split card: a permanently-dark brand panel whose glow is painted from **your accent color**, and the form beside it. The heading and tagline are yours to change (`login.heading` / `login.tagline`). The logo above the email field — Payload's by default, as in the screenshot — is **fully customizable**: set the `logo` option and your own artwork appears both here and at the top of the sidebar, sized by `logoHeight`, with separate light/dark variants supported.

![Login](docs/login.png)

### A dashboard that's actually a dashboard

The default dashboard is replaced with a widget grid: one stat card per collection with an animated document count and a **30-day creation sparkline**, plus cards for your globals. Everything is server-rendered through Payload's local API — access control applies, no loading flash. Want more? Add your own widgets below it — see [Dashboard widgets](#dashboard-widgets).

### A sidebar user menu — pinned, always

Payload's account button and content-locale switcher move into a shadcn-style user block **pinned to the bottom of the sidebar** — avatar, name and email, opening a popup with **Account**, the **locale switcher** (only when `localization` is configured) and **Log out**. When collections overflow, only the menu list scrolls; logo, search and the user block stay put. The same menu also sits in the header, next to the light/dark toggle.

### A live theme customizer in the header

The palette button opens a small panel where anyone can restyle the panel at runtime — no rebuild, no config edit:

- **Accent** — 10 curated presets plus a free hex field with a live preview dot; the choice overrides the plugin's `accent` and recolors the entire panel through the same OKLCH engine.
- **Radius** — the whole `'none' → 'full'` scale.
- **Color mode** — light/dark, stored in the same preference Payload's Account page uses (a sun/moon toggle sits right next to the palette for one-click switching).
- **Content layout** — centered (~1280px) or full width.

Everything persists in the browser; **Reset to Default** returns to your `payloadTheme({ ... })` config.

![Theme customizer](docs/customizer.png)

### ⌘K command palette

Press `⌘K` / `Ctrl+K` (or click the search pill in the sidebar) to jump anywhere: navigate to any collection or global, **search documents across collections** as you type, switch light/dark mode, or log out. Zero extra dependencies — it ships inside the theme.

![Command palette](docs/command-palette.png)

### List views with real polish

Tables become clean cards under a **single-row toolbar**: search, the Columns/Filters pills (with their own glyphs) and the solid **＋ Create New** button all share one line — secondary actions like Media's Bulk Upload dock next to it as quiet outline buttons. Status and boolean values render as **always-round neutral badges** (radius-setting-agnostic), rows get soft neutral hovers, and empty collections show an illustrated empty state instead of a blank page.

![List view](docs/list-view.png)

### Edit views: a real form layout, not a field pile

The edit form lives on one card with a **two-column field grid**: compact fields (text, number, email, select, date, checkbox, radio, relationship) pair up side by side — *Title | Slug* on one line — while wide surfaces (textareas, rich text, uploads, arrays, blocks, groups) keep the full row; custom fields safely default to full width, and everything stacks again below 1024px. Inputs follow the shadcn language (thin borders, accent focus ring), checkboxes render as toggles, top-level groups sit in muted inset panels and the doc sidebar is its own card. Up top, **Edit / Versions / API** is a segmented control, the status chip and timestamps read as one quiet meta line, and the sticky action bar — with **icons on every action**: publish, save draft, duplicate, delete, and friends — blurs the content scrolling underneath it.

![Edit view](docs/edit-view.png)

### Blocks & arrays as a card system

Structured content stops looking like stock Payload. Every block/array row is a real **card**: a numbered accent chip anchors it, the block type reads as the row title, the optional custom label is a ghost inline editor, and the kebab/chevron are standardized bordered chips. The row being edited announces itself with a soft accent ring. Adding rows is one consistent gesture everywhere — a full-width **dashed "add card" bar** that lights up in the accent on hover, for arrays and blocks alike. Collapse All / Show All get their own glyphs, and the block-picker drawer shows shadcn-style cards.

![Blocks as cards](docs/blocks.png)

### Dark mode, for free

Every surface, badge, card and glow is token-driven, so the whole theme flips with Payload's dark mode — dashboard, palette and login included.

![Dashboard dark](docs/dashboard-dark.png)

---

## Options

Everything is optional. This is the full surface:

```ts
payloadTheme({
  // The one color that drives everything: buttons, active nav pill,
  // focus rings, selected rows, sparklines, the login glow... Any hex works.
  accent: '#e30613',

  // Corner rounding for the WHOLE panel: 'none' | 'sm' | 'md' | 'lg' | 'full'.
  // 'md' (default) = the shadcn geometry (8px controls, 12px cards);
  // 'full' = pill buttons/inputs; 'none' squares everything off.
  radius: 'md',

  // Your logo — top of the sidebar AND above the login form.
  // A URL, or { light, dark } to swap artwork per color scheme.
  // Leave it out and Payload's own logo is the placeholder.
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
  // See "Dashboard widgets" below.
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
| `logo` | `string \| { light, dark }` | Payload logo | Image URL(s) shown at the top of the sidebar and above the login form. Pass a pair for per-scheme artwork. |
| `logoHeight` | `number \| string` | `26` | Rendered logo height — a number is px (`32`), a string is any CSS length (`'2.5rem'`). |
| `icon` | `string \| { light, dark }` | — | Small mark, used as a login-logo fallback. |
| `login.heading` | `string` | `'Welcome back'` | Big heading on the login brand panel. |
| `login.tagline` | `string` | `'Sign in to manage your content.'` | Supporting line under the heading. |
| `nav.icons` | `Record<slug, iconName>` | folder icon | Maps collections/globals to [lucide](https://lucide.dev) icons, used in the sidebar, dashboard cards and palette. |
| `dashboard.widgets` | `DashboardWidget[]` | `[]` | Custom components rendered below the built-in dashboard content. Empty → the dashboard is unchanged. |
| `cssVariables` | `Record<string, string>` | — | Escape hatch: override any raw `--pt-*` token directly. |

## Dashboard widgets

The built-in dashboard (collection cards, globals) always renders as-is — widgets are an *additional* area below it. Point each entry at a React component using Payload's standard import-map path convention, the same way you'd register any custom component:

```ts
payloadTheme({
  dashboard: {
    widgets: [
      // string form — 'half' width by default
      '/components/widgets/StatisticsWidget#StatisticsWidget',

      // object form — control the grid width: 'full' | 'half' | 'third'
      { component: '/components/widgets/LastLoginWidget#LastLoginWidget', width: 'third' },
    ],
  },
})
```

Widgets land in a 12-column grid under the dashboard (`full` = whole row, `half` = ½, `third` = ⅓; everything stacks on mobile). A widget is *your* component — the theme adds layout only, no forced card chrome. Reuse the theme's card classes (`pt-dash__card`, `pt-dash__card-head`, `pt-dash__card-label`, `pt-dash__card-body`, `pt-dash__card-count`, `pt-dash__card-caption`) if you want it to look like the built-in stat cards.

**Server components** receive the live Payload context as props — query anything through the local API:

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

**Client components** (`'use client'`) receive no props — use Payload's hooks (`useAuth`, `useConfig`, `useTranslation`, …) or fetch from the REST API.

The plugin registers every widget in `admin.dependencies`, so `payload generate:importmap` picks them up automatically.

## Under the hood

- **One accent, everywhere** — your hex becomes an 11-step OKLCH scale. Buttons, focus rings, the active nav pill, selected table rows, pagination, tabs, links, sparklines: all recolored consistently.
- **Smart dark mode** — the scale is re-mapped for dark (brighter accent step, never a naive inversion), so your color stays vivid on dark surfaces.
- **Automatic contrast** — text on the accent picks black or white by WCAG relative luminance. Yellow accent → black text, purple accent → white text. You never think about it.
- **Toggles, not checkboxes** — checkboxes are restyled into switches with pure CSS; form behavior and accessibility are untouched.
- **Zero runtime dependencies for color math** — the scale is computed once at startup and injected as CSS custom properties. No FOUC, SSR-safe.
- **Non-destructive** — everything ships in `@layer payload`, overriding Payload's defaults without specificity wars. Validation, form state and keyboard focus keep working.
- **Zinc foundation** — Payload's neutral scale is retargeted to the zinc palette (light *and* dark), so every elevation, border and muted text lands on the same shadcn gray ladder.
- **Icons via CSS masks** — action-button glyphs are `currentColor` masks, so they recolor with every state, accent and scheme; no markup changes, no icon fonts.
- **Runtime restyling** — the header customizer recomputes the accent scale client-side with the same engine the server uses, persists to `localStorage`, and never touches your config.

## Fine-tuning with CSS variables

Need to nudge something the options don't cover? Every token is a plain CSS custom property:

```ts
payloadTheme({
  accent: '#0ea5e9',
  cssVariables: {
    '--pt-accent-subtle': 'oklch(0.95 0.03 240)',
  },
})
```

The important ones: `--pt-accent-50` … `--pt-accent-950`, `--pt-accent`, `--pt-accent-hover`, `--pt-accent-active`, `--pt-accent-subtle`, `--pt-accent-contrast`, `--pt-accent-ring`, plus the radius tokens `--pt-radius-ctl`, `--pt-radius-card`, `--pt-radius-item`.

## Requirements

- Payload **3.x**
- Next.js **15+**, React **19**

## Troubleshooting

**"Component not found in import map"** — run `npx payload generate:importmap` after installing, then restart the dev server.

**Styles not applying** — make sure `@import 'payload-theme/styles.css';` is in `src/app/(payload)/custom.scss` (the file Payload already loads into the admin panel).

**Theme changes not showing in dev** — Turbopack caches aggressively; delete your app's `.next` folder and restart.

**`Invalid accent color: '…'`** — the accent must be a hex string like `#7c3aed`. Named colors aren't supported (yet!).

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
```
