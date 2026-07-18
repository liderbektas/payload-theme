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

## Releasing (maintainers)

1. Bump `version` in `packages/payload-theme/package.json` and move the
   `Unreleased` notes in `CHANGELOG.md` under the new version.
2. Commit, tag `vX.Y.Z`, push the tag, and create a GitHub release — the
   `release` workflow builds and publishes to npm (needs the `NPM_TOKEN`
   repo secret).
