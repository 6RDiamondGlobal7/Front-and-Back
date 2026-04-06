const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { fork, spawn } = require('child_process');

let mainWindow = null;
let backendProcess = null;
let backendStartedByApp = false;

const BACKEND_PORT = Number(process.env.BACKEND_PORT || 5000);
const BACKEND_BOOT_TIMEOUT_MS = 20000;
const SHOULD_RUN_LOCAL_BACKEND = !app.isPackaged;

function isWithinPath(targetPath, parentPath) {
  const normalizedTarget = path.resolve(targetPath).toLowerCase();
  const normalizedParent = path.resolve(parentPath).toLowerCase();
  return normalizedTarget === normalizedParent || normalizedTarget.startsWith(`${normalizedParent}${path.sep}`);
}

function isInstalledLocation(execPath) {
  if (!app.isPackaged || process.platform !== 'win32') {
    return true;
  }

  const normalizedExecPath = path.resolve(execPath).toLowerCase();
  const usersLocalProgramsPattern = /^[a-z]:\\users\\[^\\]+\\appdata\\local\\programs(\\|$)/i;

  if (usersLocalProgramsPattern.test(normalizedExecPath)) {
    return true;
  }

  const programFilesRoots = [
    process.env.ProgramFiles,
    process.env['ProgramFiles(x86)'],
    'C:\\Program Files',
    'C:\\Program Files (x86)',
  ].filter(Boolean);

  return programFilesRoots.some((root) => isWithinPath(normalizedExecPath, root));
}

function getBackendDir() {
  return path.join(__dirname, '..', 'Back-end');
}

function getBackendEntry() {
  return path.join(getBackendDir(), 'server.js');
}

function isBackendListening() {
  return new Promise((resolve) => {
    const http = require('http');
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

async function startBackendForDev() {
  if (!SHOULD_RUN_LOCAL_BACKEND) return;

  if (await isBackendListening()) {
    return;
  }

  backendProcess = fork(getBackendEntry(), [], {
    cwd: getBackendDir(),
    env: {
      ...process.env,
      PORT: String(BACKEND_PORT),
      ELECTRON_RUN_AS_NODE: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    windowsHide: true,
  });

  backendStartedByApp = true;

  const ready = await waitForBackendReady(BACKEND_BOOT_TIMEOUT_MS);
  if (!ready) {
    throw new Error(`Local backend did not become ready on port ${BACKEND_PORT}.`);
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
  } catch {}
}

function createWindow() {
  if (!isInstalledLocation(process.execPath)) {
    dialog.showErrorBox(
      'Installation Required',
      'This app must be installed using the official installer. Please run the installer and open the app from the Start Menu or desktop shortcut.'
    );
    app.quit();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1180,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(async () => {
  try {
    await startBackendForDev();
  } catch (err) {
    dialog.showErrorBox('Dev Backend Startup Failed', err.message);
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
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
