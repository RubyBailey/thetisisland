# Thetis Island Fire Hazard Worker — Minimal Security Patch

## Contents
- `fire-hazard/src/index.ts` — the **only production file changed**.
- `test-fire-worker.mjs` — optional local test script; do not copy into the Worker project.

Based on `ThetisIsland-Review-20261113-164129.zip`.

## Changes
1. Removes unauthenticated `/scrape` HTTP endpoint (returns 404). Only scheduled cron runs the scraper.
2. Allows only `GET /rating` and authorized `OPTIONS /rating` requests; other HTTP methods return 405.
3. CORS reflects only explicitly listed origins, never an unrelated origin. Direct GETs without `Origin` still work.
4. Validates KV content to prevent malformed or outdated records from generating a false current rating. The existing website fallback remains usable.
5. Keeps the current hourly cron (`0 * * * *`), KV namespace binding, fire rating values, scraper URL, and existing `ALLOWED_ORIGINS` config unchanged.

## Install locally
From your website's `thetisisland` directory:
1. Back up `fire-hazard/src/index.ts`.
2. Replace only `fire-hazard/src/index.ts` with the file included here.
3. Open PowerShell in `thetisisland/fire-hazard`.
4. Run:
   ```powershell
   npm install
   npm audit
   npx wrangler deploy --dry-run
   ```
5. If npm reports dependency conflicts while updating Wrangler, follow the prior auth-worker approach:
   ```powershell
   npm install --save-dev wrangler@latest @cloudflare/workers-types@latest
   npm audit
   npx wrangler deploy --dry-run
   ```

## Test / deploy
The dry run does **not** publish anything. Cloudflare's scheduled events and its KV namespace are not exercised by the dry run.

After validating Cloudflare account, Worker name (`thetisisland-fire-hazard`) and KV binding:
```powershell
npx wrangler deploy
```

To check responses (PowerShell):
```powershell
$base = 'https://thetisisland-fire-hazard.unger-karl11.workers.dev'
curl.exe -i "$base/rating"
curl.exe -i "$base/scrape"
curl.exe -i -X POST "$base/rating"
curl.exe -i -H "Origin: https://staging.thetisisland.pages.dev" "$base/rating"
```
Expect `/rating` 200 (possibly `stale: true` until first successful scheduled scrape); `/scrape` 404; POST 405; CORS allow-origin header only on the staging-origin request. Check the Emergency page on staging and the Cloudflare Worker cron logs after the next hourly run.

Do **not** infer that a current rating has been verified against the fire department just because the endpoint returns JSON. The website still includes its official fire department fallback link.

## Optional offline regression test
Run from the extracted patch directory (Node 22+):
```powershell
node --experimental-strip-types .\test-fire-worker.mjs
```

## Rollback
Restore the backed-up `fire-hazard/src/index.ts` and redeploy. Note that rollback restores the prior public `/scrape` endpoint; prefer reverting to a known secure revision if available.
