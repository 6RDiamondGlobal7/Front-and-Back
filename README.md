# HR Desktop App (Electron + React + Hosted API)

This workspace contains:
- `Front-end-HR` (Electron shell + React UI)
- `Back-end` (Express API intended to be deployed/hosted)

## End-user behavior (deployed app)
After installation, users only need to click the desktop app icon.
The app opens the UI and connects to your hosted backend URL.
No terminal and no `npm install` are required on user machines.

## Developer setup
1. Install frontend dependencies:
```bash
cd Front-end-HR
npm install
```
2. Install backend dependencies for local development:
```bash
cd ../Back-end
npm install
```

## Development run
From `Front-end-HR`:
```bash
npm run electron:dev
```
This uses local dev services (`localhost:5173` + `localhost:5000`).

## Hosted production API requirement
Before building production installers, configure:

`Front-end-HR/.env.production`
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

You can copy `Front-end-HR/.env.production.example` as a starting point.

## Production package
Option A (terminal, from `Front-end-HR`):
```bash
npm run electron:build
```

Option B (recommended, from workspace root):
```bash
node build.runner.cjs
```

Legacy option:
- Double-click `build.bat` at the workspace root.

What this does automatically:
- builds frontend assets (`vite build`)
- packages Electron installer configured for hosted API access

Installer output:
- `Front-end-HR/release/`

## Security notes
- Keep `SUPABASE_*`, `EMAIL_*`, and DB credentials on your hosted backend only.
- Do not place backend secrets in frontend `.env` files.
