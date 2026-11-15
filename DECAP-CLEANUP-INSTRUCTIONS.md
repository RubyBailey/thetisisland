# Decap-only CMS cleanup — installation instructions

This package contains only the changed text files, plus instructions. It does not replace or remove any website content, images, documents, or CMS collection fields.

## Replace these files in your website root
- `package.json` (removes Sveltia config synchronization)
- `docs/editor_guide.md` (updates login, repository, and branch guidance)
- `README.md` (identifies Decap as the only editor)

## Delete these two files from the website project
- `public/admin-sveltia/index.html`
- `public/admin-sveltia/config.yml`

Then delete the now-empty `public/admin-sveltia` folder.

## Explicitly unchanged
- `public/admin/config.yml` (every CMS collection and field preserved byte-for-byte)
- `public/admin/index.html`
- all `src/content/` and `src/data/` files
- all images and documents
- both Cloudflare Workers
- `astro.config.mjs` and dependencies

## Git / command-line verification
From the website project directory in PowerShell:

```powershell
npm run build
# Check there are no remaining Sveltia references in active source/config:
Get-ChildItem -Recurse -File -Include *.json,*.html,*.astro,*.ts,*.js,*.mjs,*.yml,*.yaml | Where-Object { $_.FullName -notmatch '[\/]node_modules[\/]|[\/]dist[\/]|[\/]\.git[\/]' } | Select-String -Pattern 'admin-sveltia|sync-cms-config|sveltia'
```

After deployment, check that `/admin/` loads, GitHub login works, content collections appear (including Communications Page / Visitors' Guide), file uploads work, and saving commits to the expected branch. The removed `/admin-sveltia/` route should return 404 unless a host redirect is configured.

## Important
The CMS is currently configured to edit `staging`, not `main`. Check Cloudflare Pages branch settings before publishing. The GitHub authentication Worker has separate security issues that are NOT modified in this CMS-only package.
