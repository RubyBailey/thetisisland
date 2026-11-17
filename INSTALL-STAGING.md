# Thetis Island — isolated staging Workers and Decap CMS

This patch changes configuration only. It does not modify site content, Decap collection definitions or Worker source files. Apply at the WEBSITE ROOT, with folder structure intact. **Back up your current files first.**

## Files replaced
- `auth/wrangler.toml` — production unchanged in name; staging environment added; production ALLOWED_DOMAINS includes staging for transition.
- `fire-hazard/wrangler.toml` — original production KV and hourly cron retained; isolated staging KV and cron added.
- `src/pages/emergency.astro` — staging site uses staging fire-hazard URL; other hosts use production URL.
- `package.json` — build now runs Astro and then adjusts only the *generated* Decap backend.

New file: `scripts/configure-decap.mjs`.

## Step 1: Isolated staging KV namespace

From `fire-hazard`, create a new KV namespace (NOT the existing production KV):

```powershell
npx wrangler kv namespace create FIRE_KV --env staging
```

Copy the **new namespace ID** from the output. In `fire-hazard/wrangler.toml`, replace `REPLACE_WITH_STAGING_KV_NAMESPACE_ID` with that ID. Never copy the existing production KV ID here.

## Step 2: Separate GitHub OAuth application for staging

GitHub -> Settings -> Developer settings -> OAuth Apps -> New OAuth App.
- Homepage: `https://staging.thetisisland.pages.dev`
- Authorization callback URL: `https://thetisisland-auth-staging.unger-karl11.workers.dev/callback`

From `auth`, configure the newly created OAuth app's ID and secret for the staging environment (Wrangler prompts for values; do not commit them):

```powershell
npx wrangler secret put GITHUB_CLIENT_ID --env staging
npx wrangler secret put GITHUB_CLIENT_SECRET --env staging
```

You may need to deploy the staging Auth Worker once first before setting secrets, depending on Wrangler's prompts. The callback URL above must match the app configuration. **Never put client secrets in wrangler.toml or Git.**

## Step 3: Staging Worker dry runs and deployment

From `auth`:
```powershell
npx wrangler deploy --env staging --dry-run
npx wrangler deploy --env staging
```

From `fire-hazard`:
```powershell
npx wrangler deploy --env staging --dry-run
npx wrangler deploy --env staging
```

**Do not run bare `wrangler deploy` during staging testing; that deploys to production.**

The staging fire-hazard Worker has its own hourly cron and distinct KV; the first result may show `stale:true` until the first successful scheduled run. See Cloudflare logs to verify scraping.

## Step 4: Build and publish the website to the staging BRANCH

At the site root:
```powershell
npm run build
Select-String -Path .\dist\admin\config.yml -Pattern 'branch:|base_url:'
git status
```

Local builds default to `staging`; Cloudflare Pages uses `CF_PAGES_BRANCH=staging` for preview and `CF_PAGES_BRANCH=main` for production. Once committed to the staging branch, Pages' configured build command **must be `npm run build`** and output directory `dist`.

Expected staging `dist/admin/config.yml` backend:
```
branch: staging
base_url: https://thetisisland-auth-staging.unger-karl11.workers.dev
```

**Production** branch builds target `main` and production auth. No collections or fields are changed, only backend lines in built output. Do not commit `dist`.

## Step 5: Browser tests

1. `https://staging.thetisisland.pages.dev/admin/` — log in using GitHub staging OAuth; verify editing commits to `staging`.
2. `https://staging.thetisisland.pages.dev/emergency/` — check fire hazard display or fallback.
3. `https://thetisisland-fire-hazard-staging.unger-karl11.workers.dev/rating` — current JSON after cron runs.
4. `https://thetisisland-fire-hazard-staging.unger-karl11.workers.dev/scrape` — 404.
5. Confirm existing production Worker endpoints and production CMS remain unchanged.

### Note on previous site changes

This package was prepared from the original Nov 13 ZIP plus known earlier Worker security patches; it only contains the specific files listed. Since your current local `package.json` was already cleaned for Decap-only, the included `package.json` uses that same Decap-only command set. Compare any other local customizations before overwriting.
