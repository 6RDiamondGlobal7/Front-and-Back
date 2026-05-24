# Front-end-HR

Electron + React desktop app for HR operations.

## Dev
```bash
npm install
npm run electron:dev
```

## Production build
Set hosted API URL first:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

You can place this in `.env.production` or export it in your shell.
Use `.env.production.example` as a starter file.

Then build:
```bash
npm run electron:build
```

`electron:build` will fail fast if `VITE_API_BASE_URL` is missing.
