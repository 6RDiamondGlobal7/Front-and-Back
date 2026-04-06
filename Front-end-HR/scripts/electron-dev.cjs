const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.resolve(rootDir, '..', 'Back-end');
const sharedEnv = { ...process.env, NODE_ENV: 'development' };

delete sharedEnv.ELECTRON_RUN_AS_NODE;

const childProcesses = [];
let shuttingDown = false;

function startProcess(label, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd || rootDir,
    env: options.env || sharedEnv,
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (code && code !== 0) {
      console.error(`${label} exited with code ${code}`);
      shutdown(code);
      return;
    }

    if (signal) {
      console.error(`${label} exited with signal ${signal}`);
      shutdown(1);
    }
  });

  childProcesses.push(child);
  return child;
}

function shutdown(exitCode = 0) {
  shuttingDown = true;

  for (const child of childProcesses) {
    if (!child.killed) {
      child.kill();
    }
  }

  setTimeout(() => process.exit(exitCode), 300);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

function resolvePackageBinary(packageName, binaryRelativePath) {
  const packageJsonPath = require.resolve(`${packageName}/package.json`, { paths: [rootDir] });
  return path.join(path.dirname(packageJsonPath), binaryRelativePath);
}

function ensureBackendPresent() {
  const packageJsonPath = path.join(backendDir, 'package.json');
  const serverPath = path.join(backendDir, 'server.js');

  if (!fs.existsSync(packageJsonPath) || !fs.existsSync(serverPath)) {
    console.warn('Back-end folder not found beside Front-end-HR. Starting frontend only.');
    return false;
  }

  if (!fs.existsSync(path.join(backendDir, 'node_modules'))) {
    console.error('Back-end dependencies are not installed yet. Run npm install in Front-end-HR again.');
    process.exit(1);
  }

  return true;
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.once('error', () => {
      resolve(false);
    });
  });
}

async function main() {
  const backendListening = await isPortOpen(5000);
  if (!backendListening && ensureBackendPresent()) {
    startProcess('backend', process.execPath, ['server.js'], { cwd: backendDir });
  }

  const viteListening = await isPortOpen(5173);
  if (!viteListening) {
    startProcess('vite', process.execPath, [resolvePackageBinary('vite', 'bin/vite.js')]);
  }

  const waitOnArgs = [
    resolvePackageBinary('wait-on', 'bin/wait-on'),
    'http://localhost:5000',
    'http://localhost:5173',
  ];

  const waitOn = spawn(process.execPath, waitOnArgs, {
    cwd: rootDir,
    env: sharedEnv,
    stdio: 'inherit',
    shell: false,
  });

  waitOn.on('exit', (code) => {
    if (shuttingDown) {
      return;
    }

    if (code && code !== 0) {
      console.error(`wait-on exited with code ${code}`);
      shutdown(code);
      return;
    }

    const electronBinary = require('electron');
    startProcess('electron', electronBinary, ['.']);
  });
}

main().catch((error) => {
  console.error(error);
  shutdown(1);
});
