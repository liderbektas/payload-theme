# Stylesheet architecture

The theme's CSS is authored as small, focused modules and **built into one flat
`dist/styles/theme.css`** by [`scripts/build-styles.mjs`](../../scripts/build-styles.mjs),
which inlines the `@import` lines of [`theme.css`](./theme.css) (the module
index) in order. Consumers always load a single file — no bundler `@import`
resolution, no extra requests.

## Rules of the road

- **`theme.css` is the module index.** Its `@import` order *is* the cascade
  order of the final file. Add new modules by creating a file and adding one
  import line at the right position.
- **Almost everything lives in `@layer payload`.** Payload ships its own
  styles in `@layer payload-default` and pre-declares
  `payload-default, payload`, so our rules win the cascade without
  specificity fights or `!important`.
- **`overrides/unlayered.css` must stay LAST.** A few Payload/third-party
  stylesheets ship *without* a cascade layer (react-datepicker, sonner
  toasts, `NoListResults`, `Thumbnail` sizing) — unlayered CSS beats every
  `@layer` rule, so overrides for those must be unlayered too, and later in
  the file than anything they compete with.
- **Design tokens** (`--pt-*`) are split between two places: the static ones
  (shadows, status greens, radius defaults) live in `base/foundation.css`;
  the accent scale is computed at runtime from the plugin's `accent` option
  and injected by `ThemeProvider` — never hard-code an accent color here.
- Badges/avatars/switches are always fully round (`999px`) regardless of the
  radius setting; everything else reads `--pt-radius-{ctl,card,item}`.
- Every animation sits behind `@media (prefers-reduced-motion: no-preference)`.

## Map

| Directory | Contents |
| --- | --- |
| `base/` | zinc surface tokens, shadows, status colors (`foundation`), view/keyframe motion (`motion`) |
| `components/` | one file per UI area: buttons, forms, table, nav, dashboard, header actions, media (+ grid view), command palette, toasts/skeletons (`feedback`), structured fields, login hero, … |
| `layout/` | the inset content-card frame, content container + edit-view cards, list header, two-column form grid, responsive/mobile fixes |
| `overrides/` | unlayered last-resort overrides (see above) |
