const fs = require('node:fs');
const path = require('node:path');

function fail(message) {
  process.stderr.write(`[ERROR] ${message}\n`);
  process.exit(1);
}

function getValueFromEnvFile(filePath, key) {
  if (!fs.existsSync(filePath)) return '';
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(new RegExp(`^${key}=(.+)$`, 'm'));
  return match ? String(match[1]).trim() : '';
}

const fromProcess = String(process.env.VITE_API_BASE_URL || '').trim();
const envProdPath = path.resolve(__dirname, '..', '.env.production');
const fromEnvFile = getValueFromEnvFile(envProdPath, 'VITE_API_BASE_URL');
const value = fromProcess || fromEnvFile;

if (!value) {
  fail(
    'VITE_API_BASE_URL is required for production desktop builds. Set it in Front-end-HR/.env.production or environment variables.'
  );
}

if (!/^https?:\/\//i.test(value)) {
  fail('VITE_API_BASE_URL must start with http:// or https://');
}

process.stdout.write(`[INFO] Using hosted API base URL: ${value}\n`);
