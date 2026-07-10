# Payload Theme

A modern, Filament-inspired theme and UI plugin for the [Payload CMS 3.x](https://payloadcms.com) admin panel.

Install the plugin, pick a single accent color, and Payload's default admin interface becomes a refined panel: pill-shaped active navigation, an icon sidebar, soft cards with an accent top stripe, rounded inputs, checkboxes rendered as toggles, and a widget dashboard. Every interactive element — active nav state, buttons, focus rings, selected rows — is recolored automatically from that one accent.

This repository is the development playground. The plugin itself is being extracted into a standalone, npm-publishable package (`@liderbektas/payload-theme`) as the work progresses.

---

## Goals

- **Two-line setup.** On a fresh `create-payload-app` project, installation should never exceed two lines.
- **One accent, whole panel.** A single hex value drives an entire OKLCH color scale; contrast text is chosen automatically to meet WCAG AA.
- **Zero runtime dependencies for the color engine.** The hex-to-OKLCH conversion is computed once at plugin init and injected as CSS custom properties — no flash of unstyled content, SSR-safe.
- **Never break Payload.** Form state, validation, and accessibility (focus visibility, contrast) are preserved. This is a restyle, not a fork.

---

## Target developer experience

```ts
// payload.config.ts
import { payloadTheme } from '@liderbektas/payload-theme'

export default buildConfig({
  // ...
  plugins: [
    payloadTheme({
      accent: '#e30613',
      preset: 'soft',        // 'soft' | 'noir' | 'minimal'
      radius: 'lg',
      nav: { icons: { posts: 'newspaper', users: 'users' } },
    }),
  ],
})
```

```scss
// app/(payload)/custom.scss
@import '@liderbektas/payload-theme/styles.css';
```

That is the entire installation.

---

## Configuration

| Option         | Type                            | Description                                                   |
| -------------- | ------------------------------- | ------------------------------------------------------------ |
| `accent`       | `string` (hex)                  | The single accent color. Drives the full 50–950 OKLCH scale. |
| `preset`       | `'soft' \| 'noir' \| 'minimal'` | Surface and neutral palette, independent of the accent.      |
| `radius`       | `'sm' \| 'md' \| 'lg'`          | Global corner rounding.                                      |
| `nav.icons`    | `Record<string, string>`        | Per-collection sidebar icons (lucide-react names).           |
| `cssVariables` | `Record<string, string>`        | Escape hatch to override any raw design token directly.      |

Invalid input fails loudly and clearly, for example:
`Invalid accent color: 'mor'. Expected hex like #7c3aed`.

---

## Architecture

The plugin is built in three layers, each fully in place before the next begins.

**1. Theme engine.** Pure functions convert the accent hex into an eleven-step OKLCH scale (50–950). Contrast text is selected by relative luminance for WCAG AA (a yellow accent gets black text, a purple accent gets white). Dark mode is mapped separately — the scale is never simply inverted; a brighter step becomes primary in dark. Semantic colors (error, warning, success) stay independent of the accent, and disabled states stay gray.

**2. Restyle layer.** All CSS lives inside `@layer payload` so it wins specificity without a selector arms race. Modular SCSS (`_nav`, `_buttons`, `_forms`, `_table`, `_cards`, `_misc`) compiles to a single stylesheet. No component is swapped here — active nav pills, toggle checkboxes, soft inputs, accent-striped cards, and highlighted table rows are pure CSS, keeping Payload's behavior untouched.

**3. Replacement layer.** Through Payload's `admin.components` and import-map system: an icon-grouped custom sidebar, a configurable logo and icon, and a widget-based dashboard. Selectors are kept shallow and prefer Payload's own `--theme-*` variables to stay resilient across minor Payload updates.

---

## Presets

Presets define the surface and neutral colors, independent of the accent. Each ships in both light and dark variants and coexists with Payload's own `data-theme` toggle.

- **soft** — light and airy; white cards on a faint gray field.
- **noir** — a near-black premium dark surface.
- **minimal** — pure white, thin borders, low shadow.

---

## Roadmap

- [ ] **Phase 1** — Color engine: pure hex to OKLCH to scale, contrast selection, dark mapping (unit tested).
- [ ] **Phase 2** — Tokens and the `soft` preset wired through `custom.scss`.
- [ ] **Phase 3** — Restyle layer, module by module.
- [ ] **Phase 4** — Extraction into the `@liderbektas/payload-theme` package.
- [ ] **Phase 5** — Replacement layer: nav, logo/icon, dashboard.
- [ ] **Phase 6** — `noir` and `minimal` presets, documentation, npm publish.

---

## Running the playground

Requirements: Node `^18.20.2 || >=20.9.0` and pnpm. The playground uses SQLite, so no external database is needed.

```bash
pnpm install
cp .env.example .env      # set PAYLOAD_SECRET and DATABASE_URI
pnpm seed                 # populate demo content across every field type
pnpm dev                  # http://localhost:3000/admin
```

The seed data deliberately exercises every major Payload field type — rich text, relationships, uploads, arrays, blocks, groups, conditional fields, dates, and selects — so every admin screen the theme touches has real content to render.

### Scripts

| Script                    | Purpose                            |
| ------------------------- | ---------------------------------- |
| `pnpm dev`                | Start the admin in development.    |
| `pnpm seed`               | Seed demo content.                 |
| `pnpm test:int`           | Vitest integration and unit tests. |
| `pnpm test:e2e`           | Playwright end-to-end tests.       |
| `pnpm generate:types`     | Regenerate Payload types.          |
| `pnpm generate:importmap` | Regenerate the admin import map.   |

---

## Tech stack

Payload CMS 3.85, Next.js 16, React 19, TypeScript (strict), SQLite for the playground, Vitest, and Playwright.

---

## License

MIT
