# HR Desktop App (Electron + React + Express)

This workspace contains:
- `Front-end-HR` (Electron shell + React UI)
- `Back-end` (Express API)

## End-user behavior (deployed app)
After installation, users only need to click the desktop app icon.
The app silently starts the bundled backend in the background and opens the UI.
No terminal and no `npm install` are required on user machines.

## Developer setup
1. Install frontend dependencies:
```bash
cd Front-end-HR
npm install
```
2. (Optional in most cases) Install backend dependencies manually:
```bash
cd ../Back-end
npm install
```

## Development run
From `Front-end-HR`:
```bash
npm run electron:dev
```

## Production package
Option A (terminal, from `Front-end-HR`):
```bash
npm run electron:build
```

Option B (recommended, from workspace root):
```bash
node build.cjs
```

Legacy option:
- Double-click `build.bat` at the workspace root.

What this does automatically:
- installs backend production dependencies (`Back-end/node_modules`)
- builds React (`vite build`)
- packages Electron with backend files via `extraResources`

Installer output:
- `Front-end-HR/release/`

Windows build permission note:
- If packaging fails with symbolic-link privilege errors, run terminal or `build.bat` as Administrator, or enable Windows Developer Mode.

## Notes
- Backend startup logs are written in production to:
  - `%APPDATA%/<Your App Name>/logs/backend.log`
- Backend port defaults to `5000` (or `BACKEND_PORT` if set).
