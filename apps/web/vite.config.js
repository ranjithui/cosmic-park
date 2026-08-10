import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The booking API runs on :4000 by default. In dev we proxy /api and
// /uploads to it so the browser talks to a same-origin URL (no CORS
// juggling) and uploaded media resolves. For a deployed build, set
// VITE_API_BASE_URL to the API origin instead (see src/lib/api.js).
const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/uploads': { target: API_TARGET, changeOrigin: true },
    },
  },
});
