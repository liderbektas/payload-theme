# Contributing to payload-theme

Thanks for helping make the Payload admin panel beautiful. This repo is a pnpm
monorepo: the plugin lives in [`packages/payload-theme`](packages/payload-theme),
and [`dev/`](dev) is a full Payload app that consumes it — your playground for
every change.

## Quick start

```bash
pnpm install
pnpm build          # build the plugin (dist/ is what the dev app consumes)
pnpm seed           # demo admin user + posts/media/tags
pnpm dev            # http://localhost:3000/admin
```

Log in with `dev@local.test` / `test1234`.

While iterating on plugin code, run `pnpm --filter payload-theme dev` in a
second terminal for a rebuild-on-change watch. After changing the **plugin's
component exports**, regenerate the dev app's import map:
`pnpm --filter dev generate:importmap`.

## Project layout

| Path | What lives there |
| --- | --- |
| `packages/payload-theme/src/index.ts` | the plugin factory (config transform) |
| `packages/payload-theme/src/components/` | React components (Nav, Dashboard, HeaderActions, …) |
| `packages/payload-theme/src/styles/` | the stylesheet, split into modules — **read [`src/styles/README.md`](packages/payload-theme/src/styles/README.md) before touching CSS** |
| `packages/payload-theme/src/theme/` | accent-scale math (OKLCH, contrast, CSS emit) |
| `packages/payload-theme/src/translations/` | the `payloadTheme:*` string namespace, one file per language |
| `dev/` | the playground app + integration/e2e tests |

## Checks

Run everything CI runs before opening a PR:

```bash
pnpm build && pnpm lint && pnpm test
```

- `pnpm test` = integration tests (`dev/tests/int`) + the plugin's unit tests.
- `pnpm --filter dev test:e2e` drives the real admin panel with Playwright
  (the dev server is started automatically).
- `pnpm --filter dev test:visual` runs the screenshot regression suite.
  Baselines are rendering-platform specific; if your change intentionally
  alters the UI, regenerate them with
  `pnpm --filter dev test:visual --update-snapshots` and commit the result,
  and include before/after screenshots in the PR.

## Style

- Prettier + ESLint are configured at the repo root (`pnpm lint`,
  `pnpm format`). Code style: no semicolons, single quotes, 100 columns.
- CSS: everything belongs in `@layer payload`; never use `!important`;
  unlayered overrides go only in `styles/overrides/unlayered.css` (last in
  the cascade) with a comment explaining why.
- UI changes should respect the theme contract: the accent is reserved for
  primary actions/active states, neutrals stay zinc, animations sit behind
  `prefers-reduced-motion`.

## Adding a language

The most welcome kind of PR, and the smallest:

1. Copy [`src/translations/en.ts`](packages/payload-theme/src/translations/en.ts)
   to your language code (`pl.ts`, `ja.ts`, … — it must be one of Payload's
   `acceptedLanguages`), translate the **values** and type it
   `: ThemeTranslations` like the existing files do.
2. Add it to `THEME_TRANSLATIONS` in
   [`src/translations/index.ts`](packages/payload-theme/src/translations/index.ts).
3. `pnpm test` — the suite checks every locale against the English key set,
   that no interpolation variable (`{{query}}`, `{{hex}}`) was lost in
   translation, and that nothing is blank.

Two rules that keep the namespace honest:

- **Don't add a key Payload already ships.** Reuse `general:close`,
  `general:locale`, `authentication:logOut`, `general:createNewLabel` and
  friends in the components instead — they're already translated in ~35
  languages and stay in sync for free.
- **English is the source of truth.** New strings go into `en.ts` first; every
  other locale is typed against it, so an untranslated key is a compile error
  rather than a silent gap.

Adding a string to a component? Add the key to `en.ts`, then call it through
`useThemeTranslation()` (client) or `themeT(i18n)` (server) — never inline the
literal.

## Keeping up with Payload

The theme deliberately forks nothing, which means it leans on two things Payload
doesn't version as public API: **its BEM class names** and **the DOM it
renders**. That trade is what keeps the plugin two lines to install — the cost
is this checklist. The user-facing summary lives under
[“What it touches”](README.md#what-it-touches) in the README; keep the two in
sync when the surface changes.

### Coupling map

| Coupling | Where | Assumes | Symptom when Payload changes it |
| --- | --- | --- | --- |
| Cascade layers | every CSS module | Payload declares `@layer payload-default, payload` and ships its styles in the former | theme rules lose to Payload's defaults everywhere — very visible |
| Unlayered stylesheets | `styles/overrides/unlayered.css` | `NoListResults`, `Thumbnail`, react-datepicker and sonner ship **without** a layer | either our unlayered rules become unnecessary (harmless) or a newly-unlayered Payload sheet starts beating a layered rule of ours |
| `--font-body` | `src/index.ts` | Payload declares it outside any layer, so our override is injected unlayered too | the `font` option silently stops applying |
| Payload BEM class names | all of `styles/` | `.template-default__wrap`, `.app-header`, `.collection-list .table`, `.document-fields__fields`, `.render-fields`, `.blocks-field__*`, `.array-field__*`, `.collapsible--style-default`, `.checkbox-input__*`, `.rs__menu`, `.thumbnail`, `.no-results`, … | the affected rules stop applying — stock styling shows through in one area, nothing throws |
| List-table DOM injection | `components/ListQuickActions` | `.collection-list .table > table` with `thead tr` / `tbody tr`, and each row containing an `a[href*="/collections/"]` it parses the slug + id out of | actions column missing or misaligned; a changed edit-link shape means rows fall back to the empty spacer cell |
| Edit-form DOM scan | `components/DocOutline` | `.document-fields__fields` container, section wrappers (`.group-field--top-level`, `.collapsible-field`, `.blocks-field`, `.array-field`, `.tabs-field`), `.tabs-field__tab-button`, and the label selectors in `sectionLabel()` | outline renders empty (it needs 3+ sections) or entries lose their labels |
| Media grid | `components/MediaListToggle` + `styles/components/media-grid.css` | the upload list table's `.cell-filename` / `.thumbnail` markup, reflowed into cards by CSS | grid view degrades to a plain table |
| REST routes | `ListQuickActions` (delete), `CommandPalette` (search, recents) | `config.serverURL` + `config.routes.api`, `DELETE /:slug/:id`, `GET /:slug?where=…` | quick-delete and palette search fail at runtime — check the network tab |
| `@payloadcms/ui` surface | `Nav`, `HeaderActions`, `CommandPalette`, `UserMenu`, `BoolCell`, `DocOutline`, `ThemeProvider` | `useConfig`, `useAuth`, `useNav`, `useTheme`, `useTranslation`, `useEntityVisibility`, `useLocale`, `Link`, `Gutter`, `toast`, `PayloadLogo`, `RenderServerComponent` | build/type errors — loud, caught by `pnpm build` |
| Server props & config shape | `Dashboard` (local API `count`/`find`), `LoginHero`, `ThemeProvider` | `DashboardViewServerProps` carries `payload` + `user`; `admin.custom` survives server→client serialization; login views get a **stripped** client config (hence `LoginHero` is an RSC reading `payload` directly) | dashboard counts empty, or the login hero renders unthemed |
| Config transform | `src/index.ts` | `admin.components.{Nav,actions,providers,beforeLogin,views.dashboard}`, `admin.dependencies`, per-collection `beforeListTable`, field-level `admin.components.Cell` | components silently not mounted; integration tests in `dev/tests/int` assert this shape |

### Upgrade checklist

1. Bump `payload`, `next` and every `@payloadcms/*` dependency **in both**
   `dev/package.json` and `packages/payload-theme/package.json` (devDeps — they
   are pinned there to the version the plugin is developed against), then
   `pnpm install`.
2. `pnpm build && pnpm lint && pnpm test` — catches the loud breaks: removed
   hooks, changed prop types, a config shape the integration tests no longer
   recognize.
3. `pnpm --filter dev test:visual` — **this is the real detector** for
   class-name and markup drift, which is otherwise silent. Read every diff
   before regenerating baselines; a diff here is a finding, not noise.
4. Walk the panel by hand for the DOM-coupled pieces the screenshots can't
   fully cover: login, dashboard cards, a list view (row hover actions, media
   grid toggle, bulk selection), an edit view with blocks/arrays/tabs (outline
   rail), ⌘K search + recents, the customizer, the mobile drawer, dark mode.
5. Fix drift in the module that owns the area (see the map in
   [`src/styles/README.md`](packages/payload-theme/src/styles/README.md)) — never
   with `!important`, and only unlayered if Payload's competing rule is
   unlayered too, with a comment saying so.
6. Update the tested version in the README's **Requirements** section, widen the
   peer range only if the new major is genuinely supported, and record what
   moved in `CHANGELOG.md`.

## Releasing (maintainers)

1. Bump `version` in `packages/payload-theme/package.json` and move the
   `Unreleased` notes in `CHANGELOG.md` under the new version.
2. Commit, tag `vX.Y.Z`, push the tag, and create a GitHub release — the
   `release` workflow builds and publishes to npm (needs the `NPM_TOKEN`
   repo secret).
