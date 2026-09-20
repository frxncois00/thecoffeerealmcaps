import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Separate build: never overwrites the production dist directory or router.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  build: {
    outDir: 'preview/realm-tour/build',
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(new URL('./preview/realm-tour/index.html', import.meta.url)),
    },
  },
})
