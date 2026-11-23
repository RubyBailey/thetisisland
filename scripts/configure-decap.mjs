/** Configure the built staging editor; omit it from main builds. */
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const branch = process.env.CF_PAGES_BRANCH || 'staging';
if (!['main', 'staging', 'staging2'].includes(branch)) {
  throw new Error(`Unsupported CF_PAGES_BRANCH=${branch}. Refusing to publish CMS config.`);
}
const outputDirectory = resolve('dist');
const adminDirectory = resolve(outputDirectory, 'admin');
if (branch === 'main') {
  // Remove only the generated editor directory, never the source CMS files.
  if (adminDirectory !== resolve(process.cwd(), 'dist', 'admin')) {
    throw new Error('Unexpected admin output directory.');
  }
  rmSync(adminDirectory, { recursive: true, force: true });
  console.log('Decap editor omitted from main build.');
  process.exit(0);
}
// Staging branches share the deployed OAuth service and retain their own edits.
const authHost = 'https://thetisisland-auth.unger-karl11.workers.dev';
const path = resolve('dist/admin/config.yml');
let config = readFileSync(path, 'utf8');
const branchPattern = /^(  branch: ).+$/m;
const authPattern = /^(  base_url: ).+$/m;
if (!branchPattern.test(config) || !authPattern.test(config) ||
    !/^backend:\r?\n  name: github\r?$/m.test(config)) {
  throw new Error('Unexpected Decap backend structure; refusing to change CMS fields.');
}
config = config.replace(branchPattern, `$1${branch}`)
               .replace(authPattern, `$1${authHost}`);
writeFileSync(path, config);
console.log(`Decap output configured for ${branch}: ${authHost}`);
