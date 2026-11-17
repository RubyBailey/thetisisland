ThetisIsland.net - Decap Local Editing Setup
==========================================

This package includes one safe setup script. It updates your EXISTING files,
so you do not overwrite more recent edits to package.json or your CMS fields.

1. Extract the ZIP into your current thetisisland website folder.
   It adds scripts/enable-local-decap.mjs and this README.

2. In PowerShell, open the website ROOT (not auth or fire-hazard):

   cd "D:\Users\Karl\Documents\Websites\Cufra Cliffs\2026\testbuild\thetisisland"

3. Run the one-time setup and install the local proxy:

   node .\scripts\enable-local-decap.mjs
   npm install --save-dev decap-server

4. Open PowerShell window 1 in the same root:

   npm run build
   npm run dev

   You do not have to run build every time; it is useful as a check.

5. Open PowerShell window 2 in the same root:

   npm run cms:local

6. Visit http://localhost:4321/admin/
   The local server usually uses http://localhost:8081 behind the scenes.
   Saving CMS content changes local project files only, not GitHub or Cloudflare.

IMPORTANT:
- The script adds 'local_backend: true' to public/admin/config.yml.
  Decap uses the local proxy when available and otherwise uses its GitHub
  configuration. For a strictly production-only CMS config, remove this line
  from the deployed configuration using a later build step before publishing.
- The script adds 'cms:local': 'decap-server' to package.json.
- Existing CMS collections, fields, images and content remain unchanged.
- Existing build/dev scripts, including any branch-specific CMS script, remain unchanged.
- The script creates one-time .bak files next to the two edited files. Don't
  commit these backups to GitHub.
- For local edits, review git status before committing to staging.
- The local proxy does not require login. Do not expose port 8081 to the internet.
- If npm install updates package-lock.json, retain it and commit it with package.json
  when you next push your intended staging changes.
