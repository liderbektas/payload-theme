# Deploying the live demo

The `dev/` playground doubles as a **public, read-only live demo** of the theme.
This guide gets it on the internet in ~10 minutes and keeps it safe.

## How the demo stays read-only

Set `DEMO_MODE=true` and every collection and global blocks `create` / `update` /
`delete` **at Payload's access layer** ([dev/src/access.ts](dev/src/access.ts)).
Visitors can log in, browse every screen, open every document, play with the
theme customizer — but Save, Delete and Upload are refused by the API itself,
not just hidden in the UI.

The seed also creates a dedicated demo account:

| User | Password | Purpose |
| --- | --- | --- |
| `demo@demo.test` | `demo1234` | The credentials you print on the README / login page |

Because the seed **resets all demo content on every run**, re-running it on
each deploy gives you a self-healing demo — whatever state the database drifts
into, the next boot restores it.

## Railway (recommended)

Railway builds pnpm workspaces out of the box and gives the SQLite file a
persistent volume.

1. **New Project → Deploy from GitHub repo** — pick `payload-theme`.
2. In the service **Settings**:
   - **Root Directory**: leave at `/` (the workspace root — the dev app needs
     the workspace-built `payload-theme` package).
   - **Build Command**:
     ```bash
     pnpm install --frozen-lockfile && pnpm build && pnpm --filter dev build
     ```
   - **Start Command** (seed first → self-healing demo):
     ```bash
     pnpm --filter dev seed && pnpm --filter dev start
     ```
3. **Variables**:
   ```bash
   DATABASE_URI=file:/data/demo.db
   PAYLOAD_SECRET=<generate: openssl rand -hex 32>
   DEMO_MODE=true
   ```
4. **Volume**: attach one, mount path `/data` (keeps the SQLite file across
   deploys — optional, since the seed rebuilds content anyway).
5. Deploy. Railway prints your public URL (Settings → Networking → Generate
   Domain), e.g. `https://payload-theme-demo.up.railway.app`.

### After it's live

- Put the URL + demo credentials at the top of both READMEs (root and
  `packages/payload-theme/README.md`):
  ```md
  **[Live demo →](https://YOUR-URL/admin)** — log in with `demo@demo.test` / `demo1234`
  ```
- Add the URL as the GitHub repo **website** field too:
  ```bash
  gh repo edit --homepage https://YOUR-URL/admin
  ```

## Any Docker host (Fly.io, VPS, …)

No custom Dockerfile is required if the host supports Nixpacks/Buildpacks —
use the same build/start commands and env vars as above. For a plain VPS:

```bash
git clone https://github.com/liderbektas/payload-theme && cd payload-theme
pnpm install --frozen-lockfile && pnpm build && pnpm --filter dev build
DATABASE_URI=file:/var/lib/payload-demo/demo.db \
PAYLOAD_SECRET=$(openssl rand -hex 32) \
DEMO_MODE=true \
sh -c 'pnpm --filter dev seed && pnpm --filter dev start'
```

Put it behind any reverse proxy (Caddy, nginx) for TLS.

> **Note on Vercel**: the demo uses SQLite on the filesystem, which doesn't
> persist on serverless platforms. Prefer Railway/Fly/VPS — or swap the db
> adapter to Postgres/Neon if you specifically want Vercel.

## Checklist before you share the link

- [ ] `DEMO_MODE=true` is set (try saving a doc — the API must refuse)
- [ ] `PAYLOAD_SECRET` is a fresh random value, not the example one
- [ ] Demo credentials shown publicly are only `demo@demo.test` / `demo1234`
- [ ] The README "Live demo" link points at `/admin`
