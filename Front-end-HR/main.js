import { app, BrowserWindow, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function createWindow() {
  if (!isInstalledLocation(process.execPath)) {
    dialog.showErrorBox(
      'Installation Required',
      'This app must be installed using the official installer. Please run the installer and open the app from the Start Menu or desktop shortcut.'
    );
    app.quit();
    return;
  }

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    // You can set your HR app logo here later:
    // icon: path.join(__dirname, 'src/assets/Logo.png'), 
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // In development, load the Vite server. In production, load the built HTML file.
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
