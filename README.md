# HR Desktop App (Electron + React + Hosted API)

This workspace contains:
- `Front-end-HR` (Electron shell + React UI)
- `Front-end-Applicant` (Applicant web app)
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
3. Run development app:
```bash
cd ../Front-end-HR
npm run electron:dev
```

Development mode uses local services:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Hosted production API requirement
Before building production installers, set:

`Front-end-HR/.env.production`
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

Use `Front-end-HR/.env.production.example` as a template.

## Production package
Option A (terminal, from `Front-end-HR`):
```bash
npm run electron:build
```

Option B (recommended, from workspace root):
```bash
node build.runner.cjs
```

Option C (double-click, Windows):
- Double-click `build.bat` at the workspace root.

What this does automatically:
- builds frontend assets (`vite build`)
- packages Electron installer configured for hosted API access

Installer output:
- `Front-end-HR/release/`
- Main distributable:
  - `Front-end-HR/release/6R Diamond HR Management System-Installer-1.0.0-x64.exe`

## Distribution guide
1. Build installer using one of the commands above.
2. Upload the generated `.exe` to your official distribution channel.
3. Share download link with users.
4. Tell users to:
   - Download installer
   - Run installer
   - Open app from desktop/start menu
   - Keep internet connection on

## Security notes
- Keep `SUPABASE_*`, `EMAIL_*`, and DB credentials on your hosted backend only.
- Do not place backend secrets in frontend `.env` files.
