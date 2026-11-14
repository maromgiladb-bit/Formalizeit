import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'
import path from 'path'

// Same precedence as Next.js: .env.local overrides .env.
loadEnv({ path: path.join(__dirname, '.env.local'), quiet: true })
loadEnv({ path: path.join(__dirname, '.env'), quiet: true })

import { ADMIN_STATE, BASE_URL } from './e2e/env'

const isLocal = /^http:\/\/localhost(:\d+)?/.test(BASE_URL)
const port = new URL(BASE_URL).port || '80'

// Default: a production build (`next build` + `next start`) in `.next-e2e`.
// Pages then load in about a second; `next dev` compiles every route on first
// visit, which took minutes per page here and made runs flaky.
// E2E_DEV=1 uses `next dev` instead (no build step, but slow and flaky).
const useDevServer = process.env.E2E_DEV === '1'
const serverCommand = useDevServer
  ? `npx next dev -p ${port}`
  : `npm run build && npx next start -p ${port}`

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  // The flows share one test company, so run files one at a time.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: useDevServer ? 240_000 : 90_000,
  expect: { timeout: useDevServer ? 20_000 : 10_000 },
  reporter: [['list'], ['html', { outputFolder: './e2e/.report', open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: useDevServer ? 180_000 : 30_000,
  },

  projects: [
    // Signs the test admin in once and saves the session to e2e/.auth/.
    { name: 'setup', testMatch: /global\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: ADMIN_STATE },
      dependencies: ['setup'],
      testIgnore: /global\.setup\.ts/,
    },
  ],

  // Starts the app for local runs; reuses a server already listening on the port.
  webServer: isLocal
    ? {
        command: serverCommand,
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 900_000, // first production build takes several minutes
        env: { NEXT_DIST_DIR: '.next-e2e' },
        stdout: 'ignore',
        stderr: 'pipe',
      }
    : undefined,
})
