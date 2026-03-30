const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const frontendDir = path.resolve(__dirname, '..');
const backendDir = path.resolve(frontendDir, '..', 'Back-end');
const backendPackageJson = path.join(backendDir, 'package.json');

if (!fs.existsSync(backendPackageJson)) {
  process.exit(0);
}

console.log('Installing Back-end dependencies for local HR app development...');

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  console.warn('npm_execpath is not available. Skipping Back-end dependency install.');
  process.exit(0);
}

const result = spawnSync(process.execPath, [npmCli, 'install'], {
  cwd: backendDir,
  stdio: 'inherit',
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}
