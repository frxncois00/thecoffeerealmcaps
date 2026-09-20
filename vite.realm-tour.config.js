import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const tourRoot = fileURLToPath(new URL('./preview/realm-tour', import.meta.url))
const tourOutput = fileURLToPath(new URL('./dist/preview/realm-tour', import.meta.url))

// Add the isolated tour beneath the existing production output.
export default defineConfig({
  root: tourRoot,
  base: '/preview/realm-tour/',
  plugins: [react()],
  build: {
    outDir: tourOutput,
    emptyOutDir: false,
    rollupOptions: {
      input: fileURLToPath(new URL('./preview/realm-tour/index.html', import.meta.url)),
    },
  },
})
