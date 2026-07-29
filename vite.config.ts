import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const backendUrl =
    process.env.VITE_BACKEND_URL ||
    process.env.APP_URL ||
    'https://ais-pre-xki5itro4qvkulz7ttotff-584621251809.europe-west2.run.app';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify(backendUrl),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
