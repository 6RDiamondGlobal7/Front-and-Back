const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { fork, spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

let mainWindow = null;
let backendProcess = null;
let backendStartedByApp = false;
let backendLogStream = null;

const BACKEND_PORT = Number(process.env.BACKEND_PORT || 5000);
const BACKEND_BOOT_TIMEOUT_MS = 20000;

function getBackendDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'backend');
  }

  return path.join(__dirname, '..', 'Back-end');
}

function getBackendEntry() {
  return path.join(getBackendDir(), 'server.js');
}

function ensureBackendFilesExist() {
  const backendDir = getBackendDir();
  const backendEntry = getBackendEntry();
  const backendNodeModules = path.join(backendDir, 'node_modules');

  if (!fs.existsSync(backendEntry)) {
    throw new Error(`Backend entry not found: ${backendEntry}`);
  }

  if (!fs.existsSync(backendNodeModules)) {
    throw new Error(`Backend dependencies missing: ${backendNodeModules}`);
  }
}

function ensureBackendLogger() {
  if (backendLogStream) return;

  const logsDir = path.join(app.getPath('userData'), 'logs');
  fs.mkdirSync(logsDir, { recursive: true });

  const logPath = path.join(logsDir, 'backend.log');
  backendLogStream = fs.createWriteStream(logPath, { flags: 'a' });
}

function writeBackendLog(message) {
  if (!backendLogStream) return;
  backendLogStream.write(`[${new Date().toISOString()}] ${message}\n`);
}

function isBackendListening() {
  return new Promise((resolve) => {
    const req = http.get(
      {
        host: '127.0.0.1',
        port: BACKEND_PORT,
        path: '/',
        timeout: 2000,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      }
    );

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.on('error', () => resolve(false));
  });
}

async function waitForBackendReady(timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await isBackendListening()) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  return false;
}

async function startBackend() {
  ensureBackendLogger();

  if (await isBackendListening()) {
    writeBackendLog(`Backend already listening on ${BACKEND_PORT}; using existing process.`);
    return;
  }

  ensureBackendFilesExist();

  const backendDir = getBackendDir();
  const backendEntry = getBackendEntry();

  backendProcess = fork(backendEntry, [], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: String(BACKEND_PORT),
      ELECTRON_RUN_AS_NODE: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    windowsHide: true,
  });

  backendStartedByApp = true;

  backendProcess.stdout.on('data', (chunk) => {
    writeBackendLog(`[stdout] ${String(chunk).trimEnd()}`);
  });

  backendProcess.stderr.on('data', (chunk) => {
    writeBackendLog(`[stderr] ${String(chunk).trimEnd()}`);
  });

  backendProcess.on('exit', (code, signal) => {
    writeBackendLog(`Backend exited code=${code} signal=${signal}`);
    backendProcess = null;
    backendStartedByApp = false;
  });

  const ready = await waitForBackendReady(BACKEND_BOOT_TIMEOUT_MS);
  if (!ready) {
    throw new Error(`Backend did not become ready on port ${BACKEND_PORT} within ${BACKEND_BOOT_TIMEOUT_MS}ms.`);
  }
}

function stopBackend() {
  if (!backendStartedByApp || !backendProcess || backendProcess.killed) return;

  const pid = backendProcess.pid;

  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(pid), '/t', '/f'], {
        windowsHide: true,
        stdio: 'ignore',
      });
    } else {
      backendProcess.kill('SIGTERM');
    }
  } catch (err) {
    writeBackendLog(`Failed to stop backend cleanly: ${err.message}`);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      additionalArguments: [`--backend-port=${BACKEND_PORT}`],
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(async () => {
  try {
    await startBackend();
  } catch (err) {
    const logPath = path.join(app.getPath('userData'), 'logs', 'backend.log');
    dialog.showErrorBox('Backend Startup Failed', `${err.message}\n\nCheck log:\n${logPath}`);
    app.quit();
    return;
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  stopBackend();

  if (backendLogStream) {
    backendLogStream.end();
    backendLogStream = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
