/** Adjust only the built Decap backend; never mutate public/admin/config.yml. */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const branch = process.env.CF_PAGES_BRANCH || 'staging';
if (!['main', 'staging'].includes(branch)) {
  throw new Error(`Unsupported CF_PAGES_BRANCH=${branch}. Refusing to publish CMS config.`);
}
const authHost = branch === 'main'
  ? 'https://thetisisland-auth.unger-karl11.workers.dev'
  : 'https://thetisisland-auth-staging.unger-karl11.workers.dev';
const path = resolve('dist/admin/config.yml');
let config = readFileSync(path, 'utf8');
const branchPattern = /^(  branch: ).+$/m;
const authPattern = /^(  base_url: ).+$/m;
if (!branchPattern.test(config) || !authPattern.test(config) ||
    !config.startsWith('backend:\n  name: github\n')) {
  throw new Error('Unexpected Decap backend structure; refusing to change CMS fields.');
}
config = config.replace(branchPattern, `$1${branch}`)
               .replace(authPattern, `$1${authHost}`);
writeFileSync(path, config);
console.log(`Decap output configured for ${branch}: ${authHost}`);
