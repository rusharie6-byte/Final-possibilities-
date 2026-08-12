const fs = require('fs');
const path = require('path');

const src = path.join(process.cwd(), 'dist', 'server.cjs');
const destAndroid = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'assets', 'public', 'server.cjs');
const destIos = path.join(process.cwd(), 'ios', 'App', 'public', 'server.cjs');

try {
  if (!fs.existsSync(src)) {
    console.warn('sync-server-to-assets: source dist/server.cjs not found, please run `npm run build` first.');
    process.exit(0);
  }

  // Copy to Android assets
  try {
    fs.mkdirSync(path.dirname(destAndroid), { recursive: true });
    fs.copyFileSync(src, destAndroid);
    console.log('Copied dist/server.cjs ->', destAndroid);
  } catch (e) {
    console.warn('Failed to copy to Android assets:', e.message || e);
  }

  // Try to copy to an iOS public location if exists (best-effort)
  try {
    fs.mkdirSync(path.dirname(destIos), { recursive: true });
    fs.copyFileSync(src, destIos);
    console.log('Copied dist/server.cjs ->', destIos);
  } catch (e) {
    // Not all projects have ios/App/public layout — ignore errors
  }

  process.exit(0);
} catch (err) {
  console.error('sync-server-to-assets failed:', err);
  process.exit(1);
}
