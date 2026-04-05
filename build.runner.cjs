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

function removeDirSafe(target) {
  if (!exists(target)) return;
  for (let i = 1; i <= 5; i += 1) {
    try {
      fs.rmSync(target, { recursive: true, force: true, maxRetries: 2, retryDelay: 200 });
    } catch {}
    if (!exists(target)) return;
    if (process.platform === 'win32') {
      run('taskkill', ['/F', '/T', '/IM', APP_EXE], { cwd: ROOT_DIR });
      run('powershell', ['-NoProfile', '-Command', 'Start-Sleep -Milliseconds 500'], { cwd: ROOT_DIR });
    }
    log('WARNING', `Could not remove ${target} yet. Retry ${i}/5...`);
  }
  fail(`Could not remove locked folder: ${target}`);
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

function assertEnv(envFile) {
  if (!exists(envFile)) {
    fail(`Missing required env file: ${envFile}`);
  }
  const content = fs.readFileSync(envFile, 'utf8');
  if (!/^SUPABASE_URL=.+/m.test(content)) fail(`SUPABASE_URL missing or empty in ${envFile}`);
  if (!/^SUPABASE_ANON_KEY=.+/m.test(content)) fail(`SUPABASE_ANON_KEY missing or empty in ${envFile}`);
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
  const backendDir = findDirByPredicate(path.join(ROOT_DIR, 'Back-end'), (_, dir) => exists(path.join(dir, 'server.js')));

  if (!exists(path.join(hrDir, 'package.json'))) fail('Front-end-HR folder not found.');
  if (!exists(path.join(applicantDir, 'package.json'))) fail('Front-end-Applicant folder not found.');
  if (!exists(path.join(backendDir, 'package.json'))) fail('Back-end folder not found.');

  const envPath = path.join(backendDir, '.env');
  const unpackedDir = path.join(hrDir, 'release', 'win-unpacked');

  log('INFO', `Root Dir:      ${ROOT_DIR}`);
  log('INFO', `HR Dir:        ${hrDir}`);
  log('INFO', `Applicant Dir: ${applicantDir}`);
  log('INFO', `Back-end Dir:  ${backendDir}`);

  if (run('node', ['-v']) !== 0 || runNpm(['-v']) !== 0) {
    fail('Node.js / npm not found. Install Node.js LTS then retry.');
  }

  assertEnv(envPath);

  if (exists(unpackedDir)) {
    log('INFO', 'Preparing clean release folder...');
    if (process.platform === 'win32') run('taskkill', ['/F', '/T', '/IM', APP_EXE]);
    removeDirSafe(unpackedDir);
  }

  installWithRecovery(applicantDir, 'Front-end-Applicant', ['install']);

  log('INFO', 'Building Front-end-Applicant...');
  if (runNpm(['run', 'build'], { cwd: applicantDir }) !== 0) {
    fail('Front-end-Applicant build failed.');
  }

  installWithRecovery(
    hrDir,
    'Front-end-HR',
    ['install', '--include=dev'],
    { SKIP_BACKEND_POSTINSTALL: '1', skip_backend_postinstall: '1' }
  );

  log('INFO', 'Preparing Back-end production dependencies...');
  removeDirSafe(path.join(backendDir, 'node_modules', 'back-end'));
  removeDirSafe(path.join(backendDir, 'node_modules', 'front-end-hr'));
  installWithRecovery(backendDir, 'Back-end (production)', ['install', '--omit=dev', '--ignore-scripts']);

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
    removeDirSafe(unpackedDir);
  }
  removeLegacyArtifacts(hrDir);

  log('SUCCESS', 'Build completed.');
  log('INFO', `Installer location: ${path.join(hrDir, 'release')}`);
})();
