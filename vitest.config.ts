import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // e2e/ holds Playwright specs, run with `npm run e2e`.
    exclude: ['**/node_modules/**', '**/.claude/**', 'e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
