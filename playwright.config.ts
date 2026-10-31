import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  // One worker: the 3 s / 10 s load checks are only meaningful without four browsers competing for the CPU.
  workers: 1,
  use: { baseURL: 'http://localhost:4173' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: [
    { command: 'npx vite build --mode e2e && npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: false, timeout: 180_000 },
    // Placeholder or real media from media/public (run `node scripts/make-placeholders.mjs` first).
    { command: 'npm run media', url: 'http://localhost:5174/img/H01.jpg', reuseExistingServer: true },
  ],
})
