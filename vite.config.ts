import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The Fusion staging API does not send CORS headers for localhost, so in dev we
// call it same-origin via `/fusion/*` and let Vite forward the request server-side.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/fusion': {
        target: 'https://stg-orch-api.abafusion.ai',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/fusion/, ''),
      },
    },
  },
})
