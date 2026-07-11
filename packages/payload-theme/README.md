# payload-theme

**A beautiful theme for the Payload CMS admin panel — installed in 2 lines.**

Pick one accent color, and the whole panel repaints itself: pill-shaped active nav links, an icon sidebar with your logo on top, soft cards with an accent stripe, calm shadcn-style inputs, checkboxes that become toggles, and a dashboard with live collection counts. No forked components, no config surgery — just a plugin and a CSS import.

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

## Options

Everything is optional. This is the full surface:

```ts
payloadTheme({
  // The one color that drives everything: buttons, active nav pill,
  // focus rings, selected rows, links... Any hex works.
  accent: '#e30613',

  // Surface & neutral palette: 'soft' | 'noir' | 'minimal'
  preset: 'soft',

  // Corner rounding: 'sm' | 'md' | 'lg'
  radius: 'lg',

  // Sidebar logo (shown at the top, links to the dashboard).
  // A URL, or { light, dark } to swap artwork per color scheme.
  logo: { light: '/logo.svg', dark: '/logo-dark.svg' },

  // Rendered height of the logo: a number in px, or any CSS length.
  logoHeight: 32,

  // Small mark used for the collapsed nav and the login screen.
  icon: '/mark.svg',

  // Sidebar icons per collection/global slug — any lucide.dev icon name.
  nav: {
    icons: {
      posts: 'newspaper',
      media: 'image',
      users: 'users',
      settings: 'settings',
    },
  },
})
```

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `accent` | `string` (hex) | `#4f4ece` | Generates a full 50–950 color scale in OKLCH and colors every interactive element with it. |
| `preset` | `'soft' \| 'noir' \| 'minimal'` | `'soft'` | The surface/neutral look. Independent of the accent, and each has light **and** dark variants. |
| `radius` | `'sm' \| 'md' \| 'lg'` | `'md'` | Global corner-rounding scale for cards, inputs and buttons. |
| `logo` | `string \| { light, dark }` | Payload logo | Image URL(s) rendered at the top of the sidebar. Pass a pair to use different artwork in light and dark mode. |
| `logoHeight` | `number \| string` | `26` | Rendered logo height — a number is px (`32`), a string is any CSS length (`'2.5rem'`). |
| `icon` | `string \| { light, dark }` | — | Small logo for collapsed nav & login. |
| `nav.icons` | `Record<slug, iconName>` | folder icon | Maps your collections/globals to [lucide](https://lucide.dev) icons. Unmapped ones get a folder. |
| `cssVariables` | `Record<string, string>` | — | Escape hatch: override any raw `--pt-*` token directly. |

### Presets

- **`soft`** — light, airy; white cards on a soft gray canvas. *(default)*
- **`noir`** — near-black premium dark.
- **`minimal`** — pure white, hairline borders, barely-there shadows.

All presets respect Payload's own light/dark toggle — `noir` in light mode and `soft` in dark mode both look intentional, not inverted.

## What you get

- **One accent, everywhere** — your hex becomes an 11-step OKLCH scale. Buttons, focus rings, active nav pill, selected table rows, pagination, tabs, links: all recolored consistently.
- **Smart dark mode** — the scale is re-mapped for dark (brighter accent step, never a naive inversion), so your color stays vivid on dark surfaces.
- **Automatic contrast** — text on the accent picks black or white by WCAG relative luminance. Yellow accent → black text, purple accent → white text. You never think about it.
- **Custom sidebar** — your logo up top, icon + label links below, fully-rounded pill on the active item, collection groups supported.
- **Themed dashboard** — welcome header plus a card per collection with live, access-controlled document counts (rendered on the server, no loading flash).
- **Toggles, not checkboxes** — checkboxes are restyled into switches with pure CSS; form behavior and accessibility are untouched.
- **Zero runtime dependencies for color math** — the scale is computed once at startup and injected as CSS custom properties. No FOUC, SSR-safe.
- **Non-destructive** — everything ships in `@layer payload`, overriding Payload's defaults without specificity wars. Validation, form state and keyboard focus all keep working.

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

Or target them from your own `custom.scss` — the important ones:

`--pt-accent-50` … `--pt-accent-950`, `--pt-accent`, `--pt-accent-hover`, `--pt-accent-active`, `--pt-accent-subtle`, `--pt-accent-contrast`, `--pt-accent-ring`.

## Requirements

- Payload **3.x**
- Next.js **15+**, React **19**

## Troubleshooting

**"Component not found in import map"** — run `npx payload generate:importmap` after installing, then restart the dev server.

**Styles not applying** — make sure `@import 'payload-theme/styles.css';` is in `src/app/(payload)/custom.scss` (the file Payload already loads into the admin panel).

**`Invalid accent color: '…'`** — the accent must be a hex string like `#7c3aed`. Named colors aren't supported (yet!).

## License

MIT © [Lider Bektaş](https://github.com/liderbektas)

Found a bug or want a preset? [Issues and PRs welcome](https://github.com/liderbektas/payload-theme/issues). 
