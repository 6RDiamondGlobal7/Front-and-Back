#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT_DIR = path.resolve(__dirname);
const APP_EXE = '6R Diamond HR Management System.exe';
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function log(level, msg) {
  process.stdout.write(`[${level}] ${msg}\n`);
}

function fail(msg, code = 1) {
  log('ERROR', msg);
  process.exit(code);
}

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    cwd: opts.cwd || ROOT_DIR,
    stdio: 'inherit',
    env: { ...process.env, ...(opts.env || {}) },
    shell: false,
    windowsHide: true,
  });
  return res.status ?? 1;
}

function runNpm(args, opts = {}, addInstallFlags = false) {
  const shared = addInstallFlags ? ['--no-audit', '--no-fund'] : [];
  const finalArgs = [...args, ...shared];
  const execOpts = {
    cwd: opts.cwd || ROOT_DIR,
    stdio: 'inherit',
    env: { ...process.env, ...(opts.env || {}) },
    shell: false,
    windowsHide: true,
  };
  const res = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', npmCmd, ...finalArgs], execOpts)
    : spawnSync(npmCmd, finalArgs, execOpts);
  return res.status ?? 1;
}

function removeDirSafe(target, options = {}) {
  const required = options.required !== false;
  if (!exists(target)) return true;
  for (let i = 1; i <= 5; i += 1) {
    try {
      fs.rmSync(target, { recursive: true, force: true, maxRetries: 2, retryDelay: 200 });
    } catch {}
    if (!exists(target)) return true;
    if (process.platform === 'win32') {
      run('taskkill', ['/F', '/T', '/IM', APP_EXE], { cwd: ROOT_DIR });
      run('powershell', ['-NoProfile', '-Command', 'Start-Sleep -Milliseconds 500'], { cwd: ROOT_DIR });
    }
    log('WARNING', `Could not remove ${target} yet. Retry ${i}/5...`);
  }

  const stalePath = `${target}.stale-${Date.now()}`;
  try {
    fs.renameSync(target, stalePath);
    log('WARNING', `Locked folder moved aside: ${stalePath}`);
    return true;
  } catch {}

  if (required) {
    fail(`Could not remove locked folder: ${target}`);
  }
  log('WARNING', `Proceeding even though folder is locked: ${target}`);
  return false;
}

function installWithRecovery(targetDir, label, installArgs, extraEnv = {}) {
  log('INFO', `Installing ${label} dependencies...`);

  const attempts = [
    installArgs,
    [...installArgs, '--legacy-peer-deps'],
    [...installArgs, '--legacy-peer-deps'],
    [...installArgs, '--legacy-peer-deps'],
  ];

  for (let i = 0; i < attempts.length; i += 1) {
    if (i === 2) {
      log('WARNING', `${label} install failed. Applying npm cache/network self-heal...`);
      runNpm(['cache', 'verify'], { cwd: targetDir });
      process.env.NPM_CONFIG_FETCH_RETRIES = '5';
      process.env.NPM_CONFIG_FETCH_RETRY_MINTIMEOUT = '20000';
      process.env.NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT = '120000';
      process.env.NPM_CONFIG_PREFER_ONLINE = 'true';
    }

    if (i === 3) {
      const nodeModules = path.join(targetDir, 'node_modules');
      if (exists(nodeModules)) {
        log('WARNING', `${label} install failed. Retrying with clean node_modules...`);
        removeDirSafe(nodeModules);
      }
    }

    const code = runNpm(attempts[i], { cwd: targetDir, env: extraEnv }, true);
    if (code === 0) return;
  }

  if (exists(path.join(targetDir, 'package-lock.json'))) {
    log('WARNING', `${label} install failed. Last fallback: npm ci --legacy-peer-deps`);
    const ciCode = runNpm(['ci', '--legacy-peer-deps'], { cwd: targetDir, env: extraEnv }, true);
    if (ciCode === 0) return;
  }

  fail(`${label} dependency install failed after recovery attempts.`);
}

function findDirByPredicate(defaultDir, predicate) {
  if (exists(path.join(defaultDir, 'package.json'))) return defaultDir;
  const entries = fs.readdirSync(ROOT_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const entry of entries) {
    const dir = path.join(ROOT_DIR, entry.name);
    const pkg = path.join(dir, 'package.json');
    if (!exists(pkg)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(pkg, 'utf8'));
      if (predicate(parsed, dir, entry.name)) return dir;
    } catch {}
  }
  return defaultDir;
}

function readEnvVarFromFile(envFile, key) {
  if (!exists(envFile)) return '';
  const content = fs.readFileSync(envFile, 'utf8');
  const match = content.match(new RegExp(`^${key}=(.+)$`, 'm'));
  return match ? String(match[1]).trim() : '';
}

function assertHostedApi(hrDir) {
  const envPath = path.join(hrDir, '.env.production');
  const fromProcess = String(process.env.VITE_API_BASE_URL || '').trim();
  const fromFile = readEnvVarFromFile(envPath, 'VITE_API_BASE_URL');
  const value = fromProcess || fromFile;
  if (!value) {
    fail(
      `Missing VITE_API_BASE_URL. Set it in ${envPath} or export it in your shell before running this build.`
    );
  }
  if (!/^https?:\/\//i.test(value)) {
    fail(`Invalid VITE_API_BASE_URL (${value}). Must begin with http:// or https://`);
  }
}

function removeLegacyArtifacts(hrDir) {
  const releaseDir = path.join(hrDir, 'release');
  if (!exists(releaseDir)) return;
  for (const file of fs.readdirSync(releaseDir)) {
    if (/ Setup .*\.exe(\.blockmap)?$/i.test(file)) {
      try {
        fs.rmSync(path.join(releaseDir, file), { force: true });
      } catch {}
    }
  }
}

(function main() {
  process.env.NPM_CONFIG_OFFLINE = '';
  process.env.npm_config_offline = '';
  process.env.npm_config_registry = 'https://registry.npmjs.org/';

  const hrDir = findDirByPredicate(path.join(ROOT_DIR, 'Front-end-HR'), (pkg) => pkg?.scripts?.['electron:build']);
  const applicantDir = findDirByPredicate(path.join(ROOT_DIR, 'Front-end-Applicant'), (pkg, _, name) => {
    return pkg?.name === 'application-portal' || /applicant/i.test(name);
  });
  const backendDir = findDirByPredicate(path.join(ROOT_DIR, 'Back-end'), (pkg) => pkg?.name === 'back-end');

  if (!exists(path.join(hrDir, 'package.json'))) fail('Front-end-HR folder not found.');
  if (!exists(path.join(applicantDir, 'package.json'))) fail('Front-end-Applicant folder not found.');
  if (!exists(path.join(backendDir, 'package.json'))) fail('Back-end folder not found.');

  const unpackedDir = path.join(hrDir, 'release', 'win-unpacked');

  log('INFO', `Root Dir:      ${ROOT_DIR}`);
  log('INFO', `HR Dir:        ${hrDir}`);
  log('INFO', `Applicant Dir: ${applicantDir}`);
  log('INFO', `Back-end Dir:  ${backendDir}`);

  if (run('node', ['-v']) !== 0 || runNpm(['-v']) !== 0) {
    fail('Node.js / npm not found. Install Node.js LTS then retry.');
  }

  assertHostedApi(hrDir);

  if (exists(unpackedDir)) {
    log('INFO', 'Preparing clean release folder...');
    if (process.platform === 'win32') run('taskkill', ['/F', '/T', '/IM', APP_EXE]);
    removeDirSafe(unpackedDir, { required: false });
  }

  installWithRecovery(applicantDir, 'Front-end-Applicant', ['install']);

  log('INFO', 'Building Front-end-Applicant...');
  if (runNpm(['run', 'build'], { cwd: applicantDir }) !== 0) {
    fail('Front-end-Applicant build failed.');
  }

  installWithRecovery(backendDir, 'Back-end', ['install']);

  installWithRecovery(
    hrDir,
    'Front-end-HR',
    ['install', '--include=dev'],
    { SKIP_BACKEND_POSTINSTALL: '1', skip_backend_postinstall: '1' }
  );

  log('INFO', 'Running production build...');
  const buildCode = runNpm(['run', 'electron:build'], {
    cwd: hrDir,
    env: {
      SKIP_BACKEND_POSTINSTALL: '1',
      skip_backend_postinstall: '1',
    },
  });
  if (buildCode !== 0) fail(`Production build failed with exit code ${buildCode}.`, buildCode);

  if (exists(unpackedDir)) {
    log('INFO', 'Removing internal win-unpacked output to avoid confusion...');
    removeDirSafe(unpackedDir, { required: false });
  }
  removeLegacyArtifacts(hrDir);

  log('SUCCESS', 'Build completed.');
  log('INFO', `Installer location: ${path.join(hrDir, 'release')}`);
})();
