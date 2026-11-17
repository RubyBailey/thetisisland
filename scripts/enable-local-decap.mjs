/** One-time, non-destructive setup for local Decap editing. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const packagePath = resolve(root, 'package.json');
const configPath = resolve(root, 'public/admin/config.yml');
if (!existsSync(packagePath) || !existsSync(configPath)) {
  console.error('Run this from the thetisisland website root (package.json and public/admin/config.yml required).');
  process.exit(1);
}
const pkgText = readFileSync(packagePath, 'utf8');
const configText = readFileSync(configPath, 'utf8');
const pkg = JSON.parse(pkgText);
if (pkg.name !== 'thetisisland' || !pkg.scripts || !/^backend:\s*\r?\n\s+name:\s*github/m.test(configText)) {
  throw new Error('Unexpected website package or Decap backend; no changes made.');
}
let nextConfig = configText;
if (!/^local_backend\s*:/m.test(configText)) {
  nextConfig = `local_backend: true\n\n${configText}`;
} else if (!/^local_backend:\s*true\s*$/m.test(configText)) {
  throw new Error('local_backend already exists with a different value; review it manually.');
}
if (pkg.scripts['cms:local'] && pkg.scripts['cms:local'] !== 'decap-server') {
  throw new Error('cms:local already has a different command; review it manually.');
}
pkg.scripts['cms:local'] = 'decap-server';
const nextPkg = JSON.stringify(pkg, null, 2) + '\n';
for (const [path, oldValue, newValue] of [
  [packagePath, pkgText, nextPkg],
  [configPath, configText, nextConfig],
]) {
  if (oldValue !== newValue) {
    const backup = path + '.before-local-decap.bak';
    if (!existsSync(backup)) writeFileSync(backup, oldValue);
    writeFileSync(path, newValue);
    console.log(`Updated ${path} (backup: ${backup})`);
  } else {
    console.log(`Already configured: ${path}`);
  }
}
console.log('\nRun: npm install --save-dev decap-server');
console.log('Window 1: npm run dev');
console.log('Window 2: npm run cms:local');
